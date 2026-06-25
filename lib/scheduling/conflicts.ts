import { prisma } from "@/lib/db/prisma";
import type { AvailableSlot } from "@/lib/availability/slots";
import { intervalsConflict, type SchedulingPolicy } from "@/lib/scheduling/policy";

export async function filterSlotsByJobConflicts(
  organizationId: string,
  slots: AvailableSlot[],
  policy: SchedulingPolicy,
  excludeJobId?: string,
): Promise<AvailableSlot[]> {
  if (slots.length === 0) return slots;

  const rangeStart = slots.reduce((min, s) => (s.startAt < min ? s.startAt : min), slots[0].startAt);
  const rangeEnd = slots.reduce((max, s) => (s.endAt > max ? s.endAt : max), slots[0].endAt);
  const extraMs = (policy.providerCarryOverMinutes + policy.bufferMinutesBetweenJobs) * 60_000;
  const queryEnd = new Date(rangeEnd.getTime() + extraMs);

  const conflicts = await prisma.job.findMany({
    where: {
      organizationId,
      status: { notIn: ["cancelled", "completed"] },
      ...(excludeJobId ? { id: { not: excludeJobId } } : {}),
      scheduledStartAt: { lt: queryEnd },
      scheduledEndAt: { gt: rangeStart },
    },
    select: { scheduledStartAt: true, scheduledEndAt: true },
  });

  if (conflicts.length === 0) return slots;

  return slots.filter(
    (slot) =>
      !conflicts.some((job) =>
        intervalsConflict(
          slot.startAt,
          slot.endAt,
          job.scheduledStartAt,
          job.scheduledEndAt,
          policy,
        ),
      ),
  );
}

export type ScheduleConflictJob = {
  id: string;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  status: string;
  membershipId: string | null;
  customerLabel: string;
};

export type ScheduleConflictOverlap = {
  jobId: string;
  customerLabel: string;
};

/** Returns a map of jobId → jobs it overlaps with (same assigned worker only). */
export function detectScheduleConflicts(
  jobs: ScheduleConflictJob[],
  policy: SchedulingPolicy,
): Map<string, ScheduleConflictOverlap[]> {
  const active = jobs.filter((j) => !["cancelled", "completed"].includes(j.status));
  const overlaps = new Map<string, ScheduleConflictOverlap[]>();

  function add(jobId: string, other: ScheduleConflictOverlap) {
    const list = overlaps.get(jobId) ?? [];
    if (!list.some((o) => o.jobId === other.jobId)) list.push(other);
    overlaps.set(jobId, list);
  }

  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i]!;
      const b = active[j]!;
      if (!a.membershipId || !b.membershipId || a.membershipId !== b.membershipId) continue;
      if (
        intervalsConflict(
          a.scheduledStartAt,
          a.scheduledEndAt,
          b.scheduledStartAt,
          b.scheduledEndAt,
          policy,
        )
      ) {
        add(a.id, { jobId: b.id, customerLabel: b.customerLabel });
        add(b.id, { jobId: a.id, customerLabel: a.customerLabel });
      }
    }
  }

  return overlaps;
}

type CalendarJobRow = {
  id: string;
  status: string;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  customer: { firstName: string; lastName: string };
  assignments: Array<{ membershipId: string }>;
};

export function buildJobConflictMap(
  jobs: CalendarJobRow[],
  policy: SchedulingPolicy,
): Map<string, ScheduleConflictOverlap[]> {
  return detectScheduleConflicts(
    jobs.map((j) => ({
      id: j.id,
      scheduledStartAt: j.scheduledStartAt,
      scheduledEndAt: j.scheduledEndAt,
      status: j.status,
      membershipId: j.assignments[0]?.membershipId ?? null,
      customerLabel: `${j.customer.firstName} ${j.customer.lastName}`,
    })),
    policy,
  );
}
