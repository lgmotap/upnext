import { createHmac, timingSafeEqual } from "crypto";

const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function signingSecret(): string {
  return (
    process.env.PORTAL_SESSION_SECRET ??
    process.env.CRON_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "dev-portal-prefill-secret"
  );
}

export type PrefillPayload = {
  customerId: string;
  organizationId: string;
  exp: number;
};

export function createBookingPrefillToken(
  customerId: string,
  organizationId: string,
  ttlMs = DEFAULT_TTL_MS,
): string {
  const body = JSON.stringify({ customerId, organizationId, exp: Date.now() + ttlMs });
  const sig = createHmac("sha256", signingSecret()).update(body).digest("hex");
  return Buffer.from(`${body}.${sig}`).toString("base64url");
}

export function verifyBookingPrefillToken(token: string): PrefillPayload | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const dot = decoded.lastIndexOf(".");
    if (dot < 0) return null;
    const body = decoded.slice(0, dot);
    const sig = decoded.slice(dot + 1);
    const expected = createHmac("sha256", signingSecret()).update(body).digest("hex");
    if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return null;
    }
    const payload = JSON.parse(body) as PrefillPayload;
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export type BookingPrefillDetails = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  customerNotes: string;
};
