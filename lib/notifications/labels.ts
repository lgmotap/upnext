import type { NotificationTemplate } from "@/generated/prisma/client";

export const NOTIFICATION_TEMPLATE_LABELS: Record<NotificationTemplate, string> = {
  booking_confirmation: "Booking confirmation",
  new_booking_request: "New booking request",
  booking_accepted: "Booking accepted",
  booking_declined: "Booking declined",
  booking_rescheduled: "Booking rescheduled",
  booking_reminder_24h: "24-hour reminder",
  booking_reminder_2h: "2-hour reminder",
  crew_job_assigned: "Job assigned (crew)",
  job_completed: "Job completed",
  job_rescheduled: "Job rescheduled",
  job_on_the_way: "On the way",
  job_running_late: "Running late",
  payment_request: "Payment request",
  team_invite: "Team invite",
  customer_portal_link: "Portal link",
  booking_cancelled_by_customer: "Customer cancelled",
  recurring_job_scheduled: "Recurring job scheduled",
};

export function templateLabel(template: NotificationTemplate): string {
  return NOTIFICATION_TEMPLATE_LABELS[template] ?? template.replaceAll("_", " ");
}
