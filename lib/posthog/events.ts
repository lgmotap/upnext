/** MVP analytics event names — keep in sync with docs/19-release-plan.md */

export const AnalyticsEvents = {
  bookingRequestCreated: "booking_request_created",
  bookingAccepted: "booking_accepted",
  manualBookingCreated: "manual_booking_created",
  jobCompleted: "job_completed",
  paymentLinkSent: "payment_link_sent",
} as const;

export type AnalyticsEvent = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];
