export function canCustomerCancelBooking(
  booking: { status: string; requestedStartAt: Date },
  minNoticeHours: number,
  now = new Date(),
): boolean {
  if (!["pending", "accepted"].includes(booking.status)) return false;
  if (booking.requestedStartAt <= now) return false;
  const cancelDeadline = new Date(
    booking.requestedStartAt.getTime() - minNoticeHours * 60 * 60 * 1000,
  );
  return now <= cancelDeadline;
}

export function portalCancelBlockedMessage(minNoticeHours: number): string {
  if (minNoticeHours <= 0) {
    return "This booking can no longer be cancelled online. Contact the business.";
  }
  return `Bookings must be cancelled at least ${minNoticeHours} hour${minNoticeHours === 1 ? "" : "s"} before the appointment. Contact the business for help.`;
}
