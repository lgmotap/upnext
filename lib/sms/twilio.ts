import { checkRateLimit } from "@/lib/rate-limit";

export type SendSmsParams = {
  to: string;
  from: string;
  body: string;
};

export type SendSmsResult =
  | { ok: true; sid?: string; mocked?: boolean }
  | { ok: false; error: string };

export function isTwilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER,
  );
}

export function defaultSmsFromNumber(): string | null {
  return process.env.TWILIO_FROM_NUMBER?.trim() || null;
}

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (raw.startsWith("+") && digits.length >= 10) return `+${digits}`;
  return null;
}

export async function sendSms(params: SendSmsParams): Promise<SendSmsResult> {
  const to = normalizePhone(params.to);
  if (!to) return { ok: false, error: "Invalid phone number" };

  if (!isTwilioConfigured()) {
    console.info("[sms] mock send", { to, body: params.body.slice(0, 80) });
    return { ok: true, mocked: true };
  }

  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const body = new URLSearchParams({
    To: to,
    From: params.from,
    Body: params.body,
  });

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const json = (await res.json()) as { sid?: string; message?: string };
  if (!res.ok) {
    return { ok: false, error: json.message ?? `Twilio HTTP ${res.status}` };
  }

  return { ok: true, sid: json.sid };
}

export function smsDailyLimit(): number {
  const raw = process.env.SMS_MAX_PER_ORG_PER_DAY;
  const n = raw ? Number.parseInt(raw, 10) : 100;
  return Number.isFinite(n) && n > 0 ? n : 100;
}

export function checkSmsOrgRateLimit(organizationId: string): boolean {
  const key = `sms:org:${organizationId}:${new Date().toISOString().slice(0, 10)}`;
  return checkRateLimit(key, smsDailyLimit(), 24 * 60 * 60 * 1000);
}
