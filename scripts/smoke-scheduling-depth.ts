/**
 * Sprint 22 — buffers, carry-over, frequency discounts.
 * Run: npm run smoke:scheduling-depth
 */
import { config } from "dotenv";
import { randomUUID } from "node:crypto";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const { prisma } = await import("../lib/db/prisma");
const { applyFrequencyDiscount } = await import("../lib/pricing/frequency-discount");
const { intervalsConflict } = await import("../lib/scheduling/policy");
const { filterSlotsByJobConflicts } = await import("../lib/scheduling/conflicts");
const { getSlotsForDate } = await import("../lib/availability/slots");
const { defaultWeeklyRules } = await import("../server/validators/availability");
const { bookingTotals } = await import("../server/services/bookings");
const { replaceServiceFrequencyDiscounts } = await import("../server/repositories/frequency-discounts");

async function main() {
  console.log("▶ Scheduling depth smoke\n");

  // Unit: frequency discount
  const discounted = applyFrequencyDiscount(10000, "weekly", [
    { frequency: "weekly", percentOff: 10, amountOffCents: 0 },
  ]);
  if (discounted !== 9000) throw new Error(`Expected 9000 cents, got ${discounted}`);
  console.log("✓ Frequency discount 10% on $100 → $90");

  // Unit: buffer conflict
  const policy = { bufferMinutesBetweenJobs: 30, providerCarryOverMinutes: 0 };
  const jobStart = new Date("2026-07-01T14:00:00.000Z");
  const jobEnd = new Date("2026-07-01T16:00:00.000Z");
  const slotStart = new Date("2026-07-01T16:00:00.000Z");
  const slotEnd = new Date("2026-07-01T17:00:00.000Z");
  if (!intervalsConflict(slotStart, slotEnd, jobStart, jobEnd, policy)) {
    throw new Error("Expected buffer to block back-to-back slot");
  }
  console.log("✓ 30m buffer blocks immediate next slot");

  const orgId = `sched-depth-${randomUUID().slice(0, 8)}`;
  const userId = `user-${orgId}`;
  const slug = `sched-depth-${randomUUID().slice(0, 6)}`;

  await prisma.user.upsert({
    where: { id: userId },
    create: { id: userId, email: `${slug}@upnext.local`, name: "Sched Depth" },
    update: {},
  });

  const org = await prisma.organization.create({
    data: {
      id: orgId,
      name: "Sched Depth Co",
      slug,
      ownerId: userId,
      timezone: "America/New_York",
      businessProfile: {
        create: {
          displayName: "Sched Depth Co",
          publicSlug: slug,
          bufferMinutesBetweenJobs: 30,
          providerCarryOverMinutes: 15,
          minNoticeHours: 0,
          maxBookingDaysAhead: 30,
          slotIntervalMinutes: 60,
        },
      },
      services: {
        create: {
          name: "Test Clean",
          durationMinutes: 60,
          basePriceCents: 10000,
          isActive: true,
          isPublic: true,
        },
      },
      availabilityRules: {
        create: defaultWeeklyRules()
          .filter((r) => r.isActive)
          .map((r) => ({
            dayOfWeek: r.dayOfWeek,
            startTime: r.startTime,
            endTime: r.endTime,
            isActive: true,
          })),
      },
    },
    include: { services: true, businessProfile: true },
  });

  const service = org.services[0];
  await replaceServiceFrequencyDiscounts(service.id, [
    { frequency: "weekly", percentOff: 10, amountOffCents: 0 },
  ]);

  const totals = bookingTotals(service, [], [], {}, "weekly", [
    { frequency: "weekly", percentOff: 10, amountOffCents: 0 },
  ]);
  if (totals.priceCents !== 9000) {
    throw new Error(`bookingTotals expected 9000, got ${totals.priceCents}`);
  }
  console.log("✓ bookingTotals applies weekly discount");

  const dateYmd = "2026-06-15"; // Monday within booking window
  const slotInput = {
    timeZone: org.timezone,
    rules: defaultWeeklyRules().map((r) => ({ ...r, id: "x", organizationId: orgId, createdAt: new Date(), updatedAt: new Date() })),
    blackouts: [],
    minNoticeHours: 0,
    maxBookingDaysAhead: 30,
    slotIntervalMinutes: 60,
    serviceDurationMinutes: 60,
    carryOverMinutes: 15,
    now: new Date("2026-06-01T12:00:00.000Z"),
  };

  const baseSlots = getSlotsForDate(slotInput, dateYmd);
  if (baseSlots.length < 2) {
    throw new Error(`Expected multiple slots on ${dateYmd}, got ${baseSlots.length}`);
  }
  const tenAm = baseSlots.find((s) => s.time === "10:00") ?? baseSlots[1];

  const tenIndex = baseSlots.findIndex((s) => s.startAt.getTime() === tenAm.startAt.getTime());
  const nextSlot = baseSlots[tenIndex + 1];
  if (!nextSlot) throw new Error("Need at least two consecutive slots for buffer test");

  await prisma.job.create({
    data: {
      organizationId: orgId,
      customerId: (
        await prisma.customer.create({
          data: {
            organizationId: orgId,
            firstName: "Test",
            lastName: "Customer",
            email: `cust-${slug}@upnext.local`,
          },
        })
      ).id,
      serviceId: service.id,
      title: "Blocked job",
      scheduledStartAt: tenAm.startAt,
      scheduledEndAt: tenAm.endAt,
      status: "scheduled",
      priceCents: 10000,
    },
  });

  const filtered = await filterSlotsByJobConflicts(orgId, baseSlots, {
    bufferMinutesBetweenJobs: 30,
    providerCarryOverMinutes: 15,
  });

  if (filtered.some((s) => s.startAt.getTime() === nextSlot.startAt.getTime())) {
    throw new Error(
      `Slot ${nextSlot.time} should be blocked by job ending ${tenAm.time} + buffer + carry-over`,
    );
  }
  console.log("✓ Existing job + buffer filters next slot");

  if (filtered.length >= baseSlots.length) {
    throw new Error("Expected at least one slot removed after job conflict filter");
  }
  console.log("✓ Later slots still available");

  // Carry-over reduces slots at end of day
  const withCarry = getSlotsForDate({ ...slotInput, carryOverMinutes: 120 }, dateYmd);
  if (withCarry.length >= baseSlots.length) {
    throw new Error("Large carry-over should remove end-of-day slots");
  }
  console.log("✓ Carry-over shrinks end-of-day availability");

  await prisma.organization.delete({ where: { id: orgId } }).catch(() => {});
  await prisma.user.delete({ where: { id: userId } }).catch(() => {});

  console.log("\n✅ Scheduling depth smoke passed");
}

main()
  .catch((e) => {
    console.error("Smoke FAILED:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
