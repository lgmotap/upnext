export type SchedulingPolicy = {
  bufferMinutesBetweenJobs: number;
  providerCarryOverMinutes: number;
};

export const DEFAULT_SCHEDULING_POLICY: SchedulingPolicy = {
  bufferMinutesBetweenJobs: 0,
  providerCarryOverMinutes: 0,
};

/** Minutes blocked after service end (carry-over travel/setup + gap before next job). */
export function minutesBlockedAfterServiceEnd(policy: SchedulingPolicy): number {
  return policy.providerCarryOverMinutes + policy.bufferMinutesBetweenJobs;
}

export function blockedEndAt(serviceEndAt: Date, policy: SchedulingPolicy): Date {
  const extra = minutesBlockedAfterServiceEnd(policy);
  return new Date(serviceEndAt.getTime() + extra * 60_000);
}

export function slotOccupiesUntil(slotEndAt: Date, policy: SchedulingPolicy): Date {
  return blockedEndAt(slotEndAt, policy);
}

export function intervalsConflict(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
  policy: SchedulingPolicy,
): boolean {
  const aBlockedEnd = slotOccupiesUntil(aEnd, policy);
  const bBlockedEnd = blockedEndAt(bEnd, policy);
  return aStart < bBlockedEnd && aBlockedEnd > bStart;
}
