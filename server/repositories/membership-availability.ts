import { prisma } from "@/lib/db/prisma";

export function listMembershipAvailabilityRules(membershipId: string) {
  return prisma.membershipAvailabilityRule.findMany({
    where: { membershipId },
    orderBy: { dayOfWeek: "asc" },
  });
}

export async function getMembershipForOrg(organizationId: string, membershipId: string) {
  return prisma.membership.findFirst({
    where: { id: membershipId, organizationId, status: "active" },
    include: { user: { select: { name: true, email: true } } },
  });
}

export async function saveMembershipWeeklyAvailability(
  membershipId: string,
  rules: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isActive: boolean;
  }>,
) {
  return prisma.$transaction(
    rules.map((rule) =>
      prisma.membershipAvailabilityRule.upsert({
        where: {
          membershipId_dayOfWeek: {
            membershipId,
            dayOfWeek: rule.dayOfWeek,
          },
        },
        create: {
          membershipId,
          dayOfWeek: rule.dayOfWeek,
          startTime: rule.startTime,
          endTime: rule.endTime,
          isActive: rule.isActive,
        },
        update: {
          startTime: rule.startTime,
          endTime: rule.endTime,
          isActive: rule.isActive,
        },
      }),
    ),
  );
}
