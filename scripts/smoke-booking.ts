/**
 * Smoke test for Sprint 02/03 backend — run: npx tsx scripts/smoke-booking.ts
 */
import { config } from "dotenv";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const { prisma } = await import("../lib/db/prisma");
const { getPublicAvailableDays, getPublicSlotsForDay } = await import("../server/services/bookings");
const { defaultWeeklyRules } = await import("../server/validators/availability");
const { getAvailableDays } = await import("../lib/availability/slots");

async function main() {
  const profiles = await prisma.businessProfile.findMany({
    take: 3,
    include: {
      organization: {
        include: {
          services: { where: { isActive: true, isPublic: true }, take: 1 },
        },
      },
    },
  });

  console.log(`Business profiles: ${profiles.length}`);

  if (profiles.length === 0) {
    console.log("SKIP: no business profiles — sign up first");
    return;
  }

  const profile = profiles[0];
  const service = profile.organization.services[0];

  if (!service) {
    console.log(`SKIP: ${profile.publicSlug} has no public services`);
    return;
  }

  const rules = await prisma.availabilityRule.findMany({
    where: { organizationId: profile.organizationId },
  });

  if (rules.length === 0) {
    const slotInput = {
      timeZone: profile.organization.timezone,
      rules: defaultWeeklyRules().map((r) => ({
        ...r,
        id: "default",
        organizationId: profile.organizationId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      blackouts: [],
      minNoticeHours: profile.minNoticeHours,
      maxBookingDaysAhead: profile.maxBookingDaysAhead,
      slotIntervalMinutes: profile.slotIntervalMinutes,
      serviceDurationMinutes: service.durationMinutes,
    };
    const days = getAvailableDays(slotInput);
    console.log(`✓ Slot engine (defaults): ${days.length} days for ${profile.publicSlug}`);
  } else {
    const daysResult = await getPublicAvailableDays(profile.publicSlug, service.id);
    const days = daysResult?.days ?? [];
    console.log(`✓ Public slots API: ${days.length} days for ${profile.publicSlug}`);

    if (days[0]) {
      const slots = await getPublicSlotsForDay(profile.publicSlug, service.id, days[0].date);
      console.log(`✓ First day (${days[0].date}): ${slots?.length ?? 0} slots`);
    }
  }

  const bookingCount = await prisma.bookingRequest.count({
    where: { organizationId: profile.organizationId },
  });
  const customerCount = await prisma.customer.count({
    where: { organizationId: profile.organizationId },
  });

  console.log(`✓ DB: ${customerCount} customers, ${bookingCount} booking requests`);
  console.log("Smoke test passed.");
}

main()
  .catch((e) => {
    console.error("Smoke test FAILED:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
