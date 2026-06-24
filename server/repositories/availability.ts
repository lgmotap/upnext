import { prisma } from "@/lib/db/prisma";

export function listAvailabilityRules(organizationId: string) {
  return prisma.availabilityRule.findMany({
    where: { organizationId },
    orderBy: { dayOfWeek: "asc" },
  });
}

export function listBlackoutDates(organizationId: string) {
  return prisma.blackoutDate.findMany({
    where: { organizationId },
    orderBy: { startsAt: "asc" },
  });
}

export function getBookingSettings(organizationId: string) {
  return prisma.businessProfile.findUnique({
    where: { organizationId },
    select: {
      minNoticeHours: true,
      maxBookingDaysAhead: true,
      slotIntervalMinutes: true,
    },
  });
}
