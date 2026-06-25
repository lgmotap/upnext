import { prisma } from "@/lib/db/prisma";
import {
  checkSmsOrgRateLimit,
  defaultSmsFromNumber,
  isTwilioConfigured,
  sendSms,
} from "@/lib/sms/twilio";
import { createNotificationLog } from "@/server/repositories/notifications";
import type { NotificationRecipientType, NotificationTemplate } from "@/generated/prisma/client";

type SmsPrefs = {
  smsEnabled: boolean;
  smsFromNumber: string | null;
};

async function getSmsPrefs(organizationId: string): Promise<SmsPrefs | null> {
  const profile = await prisma.businessProfile.findUnique({
    where: { organizationId },
    select: { smsEnabled: true, smsFromNumber: true },
  });
  if (!profile?.smsEnabled) return null;
  const from = profile.smsFromNumber?.trim() || defaultSmsFromNumber();
  if (!from) return null;
  return { smsEnabled: true, smsFromNumber: from };
}

export async function sendAndLogSms(params: {
  organizationId: string;
  to: string | null | undefined;
  recipientType: NotificationRecipientType;
  template: NotificationTemplate;
  relatedType: string;
  relatedId: string;
  body: string;
}): Promise<void> {
  if (!params.to?.trim()) return;

  const prefs = await getSmsPrefs(params.organizationId);
  if (!prefs?.smsFromNumber) {
    await createNotificationLog({
      organizationId: params.organizationId,
      recipientType: params.recipientType,
      recipientEmail: params.to,
      channel: "sms",
      template: params.template,
      status: "skipped",
      relatedType: params.relatedType,
      relatedId: params.relatedId,
      error: isTwilioConfigured() ? "SMS from number not configured" : "TWILIO_* not set",
    });
    return;
  }

  if (!checkSmsOrgRateLimit(params.organizationId)) {
    await createNotificationLog({
      organizationId: params.organizationId,
      recipientType: params.recipientType,
      recipientEmail: params.to,
      channel: "sms",
      template: params.template,
      status: "skipped",
      relatedType: params.relatedType,
      relatedId: params.relatedId,
      error: "Daily SMS limit reached",
    });
    return;
  }

  const result = await sendSms({
    to: params.to,
    from: prefs.smsFromNumber,
    body: params.body,
  });

  await createNotificationLog({
    organizationId: params.organizationId,
    recipientType: params.recipientType,
    recipientEmail: params.to,
    channel: "sms",
    template: params.template,
    status: result.ok ? "sent" : "failed",
    relatedType: params.relatedType,
    relatedId: params.relatedId,
    error: result.ok ? null : result.error,
    resendEmailId: result.ok && "sid" in result ? result.sid ?? null : null,
  });
}

export async function maybeSendCustomerSms(
  organizationId: string,
  toggle: boolean | undefined,
  params: Omit<Parameters<typeof sendAndLogSms>[0], "organizationId">,
) {
  if (!toggle) return;
  await sendAndLogSms({ organizationId, ...params });
}
