import {
  listAvailabilityRules,
} from "@/server/repositories/availability";
import {
  listMembershipAvailabilityRules,
} from "@/server/repositories/membership-availability";
import { intersectWeeklyRules, type WeeklyRule } from "@/lib/availability/intersect-rules";

export async function resolveRulesForMembership(
  organizationId: string,
  membershipId?: string,
): Promise<WeeklyRule[]> {
  const orgRules = await listAvailabilityRules(organizationId);
  if (!membershipId) return orgRules;

  const memberRules = await listMembershipAvailabilityRules(membershipId);
  return intersectWeeklyRules(orgRules, memberRules);
}

export async function isMembershipAvailableAtSlot(
  organizationId: string,
  membershipId: string,
  dateYmd: string,
  timeHm: string,
  serviceDurationMinutes: number,
): Promise<boolean> {
  const { isSlotAvailable } = await import("@/lib/availability/slots");
  const { listBlackoutDates, getBookingSettings } = await import("@/server/repositories/availability");
  const { prisma } = await import("@/lib/db/prisma");

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: { businessProfile: true },
  });
  if (!org?.businessProfile) return false;

  const [rules, blackouts, booking] = await Promise.all([
    resolveRulesForMembership(organizationId, membershipId),
    listBlackoutDates(organizationId),
    getBookingSettings(organizationId),
  ]);

  const profile = org.businessProfile;
  const slot = isSlotAvailable(
    {
      timeZone: org.timezone,
      rules,
      blackouts,
      minNoticeHours: 0,
      maxBookingDaysAhead: booking?.maxBookingDaysAhead ?? profile.maxBookingDaysAhead,
      slotIntervalMinutes: booking?.slotIntervalMinutes ?? profile.slotIntervalMinutes,
      serviceDurationMinutes,
    },
    dateYmd,
    timeHm,
  );

  return slot !== null;
}
