import { z } from "zod";
import { isTwilioConfigured } from "@/lib/sms/twilio";

export const notificationSettingsSchema = z.object({
  notifyOwnerNewBooking: z.coerce.boolean(),
  notifyCustomerBookingConfirmation: z.coerce.boolean(),
  notifyCustomerReminder24h: z.coerce.boolean(),
  notifyCustomerReminder2h: z.coerce.boolean(),
  notifyCustomerJobCompleted: z.coerce.boolean(),
  notifyCustomerPaymentRequest: z.coerce.boolean(),
});

export const smsNotificationSettingsSchema = z.object({
  smsEnabled: z.coerce.boolean(),
  smsFromNumber: z.string().trim().max(30).optional(),
  notifyCustomerSmsReminder24h: z.coerce.boolean(),
  notifyCustomerSmsOnTheWay: z.coerce.boolean(),
  notifyCustomerSmsRunningLate: z.coerce.boolean(),
  notifyWorkerSmsJobAssigned: z.coerce.boolean(),
});

export type NotificationSettingsInput = z.infer<typeof notificationSettingsSchema>;
export type SmsNotificationSettingsInput = z.infer<typeof smsNotificationSettingsSchema>;

export const NOTIFICATION_SETTING_META = [
  {
    key: "notifyOwnerNewBooking" as const,
    label: "New booking request",
    desc: "Email me when a customer submits a request.",
  },
  {
    key: "notifyCustomerBookingConfirmation" as const,
    label: "Booking confirmation to customer",
    desc: "Send an automatic confirmation email.",
  },
  {
    key: "notifyCustomerReminder24h" as const,
    label: "24-hour reminder",
    desc: "Remind customers the day before their job.",
  },
  {
    key: "notifyCustomerReminder2h" as const,
    label: "2-hour reminder",
    desc: "Send a same-day reminder before arrival.",
  },
  {
    key: "notifyCustomerJobCompleted" as const,
    label: "Job completed summary",
    desc: "Email the customer a recap when a job is done.",
  },
  {
    key: "notifyCustomerPaymentRequest" as const,
    label: "Payment request",
    desc: "Email a payment link when requested.",
  },
];

export const SMS_NOTIFICATION_SETTING_META = [
  {
    key: "notifyCustomerSmsReminder24h" as const,
    label: "24-hour SMS reminder",
    desc: "Text customers the day before their job.",
  },
  {
    key: "notifyCustomerSmsOnTheWay" as const,
    label: "On the way SMS",
    desc: "Text when crew taps On the way.",
  },
  {
    key: "notifyCustomerSmsRunningLate" as const,
    label: "Running late SMS",
    desc: "Text when crew notifies running late.",
  },
  {
    key: "notifyWorkerSmsJobAssigned" as const,
    label: "Job assigned SMS (worker)",
    desc: "Text assigned worker when phone is on file (future).",
  },
];

export function twilioSetupHint(): string {
  return isTwilioConfigured()
    ? "Twilio credentials detected — set your sending number below."
    : "Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER to enable live SMS. Without them, SMS is logged as mock/skipped.";
}
