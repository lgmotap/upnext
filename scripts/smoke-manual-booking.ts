/**
 * Smoke: owner manual booking → job with source=manual.
 * Run: npx tsx scripts/smoke-manual-booking.ts
 */
import { config } from "dotenv";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const { prisma } = await import("../lib/db/prisma");
const { saveWeeklyAvailability } = await import("../server/services/availability");
const { defaultWeeklyRules } = await import("../server/validators/availability");
const { getOrgAvailableDays, getOrgSlotsForDay, createManualBooking } = await import(
  "../server/services/bookings"
);

const TEST_SLUG = "smoke-test-co";

async function main() {
  console.log("▶ Manual booking smoke test\n");

  const org = await prisma.organization.findFirst({
    where: { businessProfile: { publicSlug: TEST_SLUG } },
    include: { services: true },
  });
  if (!org) throw new Error("Run smoke:e2e first to seed smoke-test-co org");

  const service = org.services.find((s) => s.isActive && !s.isAddon) ?? org.services[0];
  if (!service) throw new Error("No active service");

  await saveWeeklyAvailability(org.id, { rules: defaultWeeklyRules() });

  const daysResult = await getOrgAvailableDays(org.id, service.id);
  const days = daysResult?.days ?? [];
  if (days.length === 0) throw new Error("No available days");

  const slots = (await getOrgSlotsForDay(org.id, service.id, days[0].date)) ?? [];
  if (slots.length === 0) throw new Error("No slots");

  const result = await createManualBooking(org.id, {
    serviceId: service.id,
    addonServiceIds: [],
    date: days[0].date,
    time: slots[0].time,
    frequency: "one_time",
    firstName: "Manual",
    lastName: "Smoke",
    email: `manual-smoke+${Date.now()}@upnext.local`,
    phone: "",
    line1: "456 Manual Ave",
    line2: "",
    city: "Testville",
    region: "NY",
    postalCode: "10001",
    customerNotes: "Manual booking smoke test",
    assignMembershipId: "",
  });

  if (!result.ok) throw new Error(`Manual booking failed: ${result.error}`);
  console.log(`✓ Created manual booking → job ${result.jobId}`);

  const booking = await prisma.bookingRequest.findUnique({
    where: { id: result.bookingRequestId },
    include: { job: true },
  });
  if (!booking) throw new Error("Booking not found");
  if (booking.source !== "manual") throw new Error(`Expected source=manual, got ${booking.source}`);
  if (booking.frequency !== "one_time") throw new Error(`Expected frequency=one_time, got ${booking.frequency}`);
  if (booking.status !== "accepted") throw new Error(`Expected accepted, got ${booking.status}`);
  if (!booking.job || booking.job.status !== "scheduled") throw new Error("Job not scheduled");

  console.log("✓ source=manual, status=accepted, job scheduled");
  console.log("\n✓ Manual booking smoke test passed");
}

main()
  .catch((e) => {
    console.error("\n✗ Manual booking smoke FAILED:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
