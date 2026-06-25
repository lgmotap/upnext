import { assignJobToMember } from "@/server/repositories/assignments";
import { prisma } from "@/lib/db/prisma";
import {
  getAvailableDays,
  getSlotsForDate,
  isSlotAvailable,
  type AvailableSlot,
  type SlotDay,
} from "@/lib/availability/slots";
import { filterSlotsByJobConflicts } from "@/lib/scheduling/conflicts";
import type { SchedulingPolicy } from "@/lib/scheduling/policy";
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
  schedulingPolicy: SchedulingPolicy;
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
  const schedulingPolicy = {
    bufferMinutesBetweenJobs: profile.bufferMinutesBetweenJobs ?? 0,
    providerCarryOverMinutes: profile.providerCarryOverMinutes ?? 0,
  };

  return {
    timeZone: org.timezone,
    schedulingPolicy,
    slotInput: {
      timeZone: org.timezone,
      rules,
      blackouts,
      minNoticeHours: 0,
      maxBookingDaysAhead: booking?.maxBookingDaysAhead ?? profile.maxBookingDaysAhead,
      slotIntervalMinutes: booking?.slotIntervalMinutes ?? profile.slotIntervalMinutes,
      serviceDurationMinutes,
      carryOverMinutes: schedulingPolicy.providerCarryOverMinutes,
    },
  };
}

function durationMinutesFromRange(start: Date, end: Date): number {
  return Math.max(15, Math.round((end.getTime() - start.getTime()) / 60_000));
}

async function filterConflicts(
  organizationId: string,
  slots: AvailableSlot[],
  policy: SchedulingPolicy,
  excludeJobId?: string,
) {
  return filterSlotsByJobConflicts(organizationId, slots, policy, excludeJobId);
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
  return filterConflicts(organizationId, slots, ctx.schedulingPolicy, jobId);
}

export async function rescheduleJob(
  organizationId: string,
  jobId: string,
  dateYmd: string,
  timeHm: string,
  membershipId?: string | null,
) {
  const job = await getJobForOrg(organizationId, jobId);
  if (!job || job.status === "completed" || job.status === "cancelled") {
    return { ok: false as const, error: "Job cannot be rescheduled" };
  }

  const duration = durationMinutesFromRange(job.scheduledStartAt, job.scheduledEndAt);
  const assigneeId = membershipId ?? job.assignments[0]?.membershipId;
  const ctx = await loadOwnerSlotContext(organizationId, duration, assigneeId);
  if (!ctx) return { ok: false as const, error: "Scheduling is not configured" };

  const slot = isSlotAvailable(ctx.slotInput, dateYmd, timeHm);
  if (!slot) return { ok: false as const, error: "Selected time is not available" };

  const [available] = await filterConflicts(organizationId, [slot], ctx.schedulingPolicy, jobId);
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

  if (membershipId && membershipId !== job.assignments[0]?.membershipId) {
    const assigned = await assignJobToMember(jobId, membershipId, organizationId);
    if (!assigned) return { ok: false as const, error: "Could not assign worker" };
  }

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
  return filterConflicts(organizationId, slots, ctx.schedulingPolicy);
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

  const [available] = await filterConflicts(organizationId, [slot], ctx.schedulingPolicy);
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
