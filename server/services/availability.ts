import { prisma } from "@/lib/db/prisma";
import type { BookingWindowInput, WeeklyAvailabilityInput } from "@/server/validators/availability";

export async function saveWeeklyAvailability(organizationId: string, input: WeeklyAvailabilityInput) {
  return prisma.$transaction(
    input.rules.map((rule) =>
      prisma.availabilityRule.upsert({
        where: {
          organizationId_dayOfWeek: {
            organizationId,
            dayOfWeek: rule.dayOfWeek,
          },
        },
        create: {
          organizationId,
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

export async function saveBookingWindow(organizationId: string, input: BookingWindowInput) {
  return prisma.businessProfile.update({
    where: { organizationId },
    data: {
      minNoticeHours: input.minNoticeHours,
      maxBookingDaysAhead: input.maxBookingDaysAhead,
      slotIntervalMinutes: input.slotIntervalMinutes,
    },
  });
}

export async function addBlackoutDate(
  organizationId: string,
  data: { startsAt: Date; endsAt: Date; reason?: string | null },
) {
  return prisma.blackoutDate.create({
    data: {
      organizationId,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      reason: data.reason ?? null,
    },
  });
}

export async function removeBlackoutDate(organizationId: string, blackoutId: string) {
  const row = await prisma.blackoutDate.findFirst({
    where: { id: blackoutId, organizationId },
  });
  if (!row) return false;
  await prisma.blackoutDate.delete({ where: { id: blackoutId } });
  return true;
}
