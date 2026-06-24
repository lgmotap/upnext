import { prisma } from "@/lib/db/prisma";
import {
  getAvailableDays,
  getSlotsForDate,
  isSlotAvailable,
  type AvailableSlot,
  type SlotDay,
} from "@/lib/availability/slots";
import {
  listBlackoutDates,
  getBookingSettings,
} from "@/server/repositories/availability";
import { resolveRulesForMembership } from "@/server/services/membership-availability";
import { getBookingRequestForOrg } from "@/server/repositories/bookings";
import { getJobForOrg } from "@/server/repositories/jobs";
import {
  notifyBookingRescheduled,
  notifyJobRescheduled,
} from "@/server/services/notifications";

type SlotContext = {
  timeZone: string;
  slotInput: Parameters<typeof getAvailableDays>[0];
};

async function loadOwnerSlotContext(
  organizationId: string,
  serviceDurationMinutes: number,
  membershipId?: string,
): Promise<SlotContext | null> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: { businessProfile: true },
  });
  if (!org?.businessProfile) return null;

  const [rules, blackouts, booking] = await Promise.all([
    resolveRulesForMembership(organizationId, membershipId),
    listBlackoutDates(organizationId),
    getBookingSettings(organizationId),
  ]);

  const profile = org.businessProfile;

  return {
    timeZone: org.timezone,
    slotInput: {
      timeZone: org.timezone,
      rules,
      blackouts,
      minNoticeHours: 0,
      maxBookingDaysAhead: booking?.maxBookingDaysAhead ?? profile.maxBookingDaysAhead,
      slotIntervalMinutes: booking?.slotIntervalMinutes ?? profile.slotIntervalMinutes,
      serviceDurationMinutes,
    },
  };
}

async function filterJobConflicts(
  organizationId: string,
  slots: AvailableSlot[],
  excludeJobId?: string,
): Promise<AvailableSlot[]> {
  if (slots.length === 0) return slots;

  const rangeStart = slots.reduce((min, s) => (s.startAt < min ? s.startAt : min), slots[0].startAt);
  const rangeEnd = slots.reduce((max, s) => (s.endAt > max ? s.endAt : max), slots[0].endAt);

  const conflicts = await prisma.job.findMany({
    where: {
      organizationId,
      status: { notIn: ["cancelled", "completed"] },
      ...(excludeJobId ? { id: { not: excludeJobId } } : {}),
      scheduledStartAt: { lt: rangeEnd },
      scheduledEndAt: { gt: rangeStart },
    },
    select: { scheduledStartAt: true, scheduledEndAt: true },
  });

  if (conflicts.length === 0) return slots;

  return slots.filter(
    (slot) =>
      !conflicts.some(
        (c) => slot.startAt < c.scheduledEndAt && slot.endAt > c.scheduledStartAt,
      ),
  );
}

function durationMinutesFromRange(start: Date, end: Date): number {
  return Math.max(15, Math.round((end.getTime() - start.getTime()) / 60_000));
}

export async function getRescheduleDaysForJob(
  organizationId: string,
  jobId: string,
): Promise<{ days: SlotDay[]; timeZone: string } | null> {
  const job = await getJobForOrg(organizationId, jobId);
  if (!job || job.status === "completed" || job.status === "cancelled") return null;

  const duration = durationMinutesFromRange(job.scheduledStartAt, job.scheduledEndAt);
  const assigneeId = job.assignments[0]?.membershipId;
  const ctx = await loadOwnerSlotContext(organizationId, duration, assigneeId);
  if (!ctx) return null;

  const days = getAvailableDays(ctx.slotInput);
  return { days, timeZone: ctx.timeZone };
}

export async function getRescheduleSlotsForJob(
  organizationId: string,
  jobId: string,
  dateYmd: string,
): Promise<AvailableSlot[] | null> {
  const job = await getJobForOrg(organizationId, jobId);
  if (!job || job.status === "completed" || job.status === "cancelled") return null;

  const duration = durationMinutesFromRange(job.scheduledStartAt, job.scheduledEndAt);
  const assigneeId = job.assignments[0]?.membershipId;
  const ctx = await loadOwnerSlotContext(organizationId, duration, assigneeId);
  if (!ctx) return null;

  const slots = getSlotsForDate(ctx.slotInput, dateYmd);
  return filterJobConflicts(organizationId, slots, jobId);
}

export async function rescheduleJob(
  organizationId: string,
  jobId: string,
  dateYmd: string,
  timeHm: string,
) {
  const job = await getJobForOrg(organizationId, jobId);
  if (!job || job.status === "completed" || job.status === "cancelled") {
    return { ok: false as const, error: "Job cannot be rescheduled" };
  }

  const duration = durationMinutesFromRange(job.scheduledStartAt, job.scheduledEndAt);
  const assigneeId = job.assignments[0]?.membershipId;
  const ctx = await loadOwnerSlotContext(organizationId, duration, assigneeId);
  if (!ctx) return { ok: false as const, error: "Scheduling is not configured" };

  const slot = isSlotAvailable(ctx.slotInput, dateYmd, timeHm);
  if (!slot) return { ok: false as const, error: "Selected time is not available" };

  const [available] = await filterJobConflicts(organizationId, [slot], jobId);
  if (!available) return { ok: false as const, error: "That time conflicts with another job" };

  await prisma.$transaction(async (tx) => {
    await tx.job.update({
      where: { id: jobId },
      data: {
        scheduledStartAt: available.startAt,
        scheduledEndAt: available.endAt,
      },
    });

    if (job.bookingRequestId) {
      await tx.bookingRequest.update({
        where: { id: job.bookingRequestId },
        data: {
          requestedStartAt: available.startAt,
          requestedEndAt: available.endAt,
        },
      });
    }
  });

  await notifyJobRescheduled(organizationId, jobId);
  return { ok: true as const };
}

export async function getRescheduleDaysForBooking(
  organizationId: string,
  bookingRequestId: string,
): Promise<{ days: SlotDay[]; timeZone: string } | null> {
  const booking = await getBookingRequestForOrg(organizationId, bookingRequestId);
  if (!booking || booking.status !== "pending") return null;

  const duration = durationMinutesFromRange(booking.requestedStartAt, booking.requestedEndAt);
  const ctx = await loadOwnerSlotContext(organizationId, duration);
  if (!ctx) return null;

  return { days: getAvailableDays(ctx.slotInput), timeZone: ctx.timeZone };
}

export async function getRescheduleSlotsForBooking(
  organizationId: string,
  bookingRequestId: string,
  dateYmd: string,
): Promise<AvailableSlot[] | null> {
  const booking = await getBookingRequestForOrg(organizationId, bookingRequestId);
  if (!booking || booking.status !== "pending") return null;

  const duration = durationMinutesFromRange(booking.requestedStartAt, booking.requestedEndAt);
  const ctx = await loadOwnerSlotContext(organizationId, duration);
  if (!ctx) return null;

  const slots = getSlotsForDate(ctx.slotInput, dateYmd);
  return filterJobConflicts(organizationId, slots);
}

export async function rescheduleBookingRequest(
  organizationId: string,
  bookingRequestId: string,
  dateYmd: string,
  timeHm: string,
) {
  const booking = await getBookingRequestForOrg(organizationId, bookingRequestId);
  if (!booking || booking.status !== "pending") {
    return { ok: false as const, error: "Booking request cannot be rescheduled" };
  }

  const duration = durationMinutesFromRange(booking.requestedStartAt, booking.requestedEndAt);
  const ctx = await loadOwnerSlotContext(organizationId, duration);
  if (!ctx) return { ok: false as const, error: "Scheduling is not configured" };

  const slot = isSlotAvailable(ctx.slotInput, dateYmd, timeHm);
  if (!slot) return { ok: false as const, error: "Selected time is not available" };

  const [available] = await filterJobConflicts(organizationId, [slot]);
  if (!available) return { ok: false as const, error: "That time conflicts with another job" };

  await prisma.bookingRequest.update({
    where: { id: bookingRequestId },
    data: {
      requestedStartAt: available.startAt,
      requestedEndAt: available.endAt,
    },
  });

  await notifyBookingRescheduled(organizationId, bookingRequestId);
  return { ok: true as const };
}
