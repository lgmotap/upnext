import { z } from "zod";

export const notificationSettingsSchema = z.object({
  notifyOwnerNewBooking: z.coerce.boolean(),
  notifyCustomerBookingConfirmation: z.coerce.boolean(),
  notifyCustomerReminder24h: z.coerce.boolean(),
  notifyCustomerReminder2h: z.coerce.boolean(),
  notifyCustomerJobCompleted: z.coerce.boolean(),
  notifyCustomerPaymentRequest: z.coerce.boolean(),
});

export type NotificationSettingsInput = z.infer<typeof notificationSettingsSchema>;

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
