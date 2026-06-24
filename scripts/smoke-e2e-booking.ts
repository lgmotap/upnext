/**
 * End-to-end smoke: seed → slots → booking → accept → job.
 * Run: npx tsx scripts/smoke-e2e-booking.ts
 */
import { config } from "dotenv";
import { randomUUID } from "crypto";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const { prisma } = await import("../lib/db/prisma");
const { saveWeeklyAvailability } = await import("../server/services/availability");
const { defaultWeeklyRules } = await import("../server/validators/availability");
const { getPublicAvailableDays, getPublicSlotsForDay, createPublicBooking } = await import(
  "../server/services/bookings"
);
const { createJobFromBookingRequest } = await import("../server/services/jobs");

const TEST_SLUG = "smoke-test-co";
const TEST_USER_ID = "smoke-test-user-00000001";

async function main() {
  console.log("▶ E2E booking smoke test\n");

  let org = await prisma.organization.findFirst({
    where: { businessProfile: { publicSlug: TEST_SLUG } },
    include: { businessProfile: true, services: true },
  });

  if (!org) {
    const user = await prisma.user.upsert({
      where: { id: TEST_USER_ID },
      create: { id: TEST_USER_ID, email: "smoke-test@upnext.local", name: "Smoke Test" },
      update: {},
    });

    org = await prisma.organization.create({
      data: {
        name: "Smoke Test Co",
        slug: `smoke-test-${randomUUID().slice(0, 8)}`,
        ownerId: user.id,
        timezone: "America/New_York",
        memberships: {
          create: { userId: user.id, role: "owner", status: "active" },
        },
        businessProfile: {
          create: {
            displayName: "Smoke Test Co",
            publicSlug: TEST_SLUG,
            serviceArea: "Test City",
            bookingEnabled: true,
          },
        },
        services: {
          create: {
            name: "Test Clean",
            durationMinutes: 60,
            basePriceCents: 15000,
            isActive: true,
            isPublic: true,
          },
        },
      },
      include: { businessProfile: true, services: true },
    });
    console.log("✓ Seeded test org + service");
  } else {
    console.log("✓ Using existing test org");
  }

  const service = org.services[0] ?? (await prisma.service.findFirst({ where: { organizationId: org.id } }));
  if (!service) throw new Error("No service");

  await saveWeeklyAvailability(org.id, { rules: defaultWeeklyRules() });
  console.log("✓ Saved default availability");

  const daysResult = await getPublicAvailableDays(TEST_SLUG, service.id);
  const days = daysResult?.days ?? [];
  if (days.length === 0) throw new Error("No available days");
  console.log(`✓ ${days.length} bookable days`);

  const slots = (await getPublicSlotsForDay(TEST_SLUG, service.id, days[0].date)) ?? [];
  if (slots.length === 0) throw new Error("No slots on first day");
  console.log(`✓ ${slots.length} slots on ${days[0].date}`);

  const booking = await createPublicBooking({
    businessSlug: TEST_SLUG,
    serviceId: service.id,
    addonServiceIds: [],
    date: days[0].date,
    time: slots[0].time,
    firstName: "Smoke",
    lastName: "Tester",
    email: `smoke+${Date.now()}@upnext.local`,
    phone: "",
    line1: "123 Test St",
    line2: "",
    city: "Testville",
    region: "NY",
    postalCode: "10001",
    customerNotes: "Automated smoke test",
  });

  if (!booking.ok) throw new Error(`Booking failed: ${booking.error}`);
  console.log(`✓ Created booking ${booking.bookingRequestId}`);

  const jobResult = await createJobFromBookingRequest(org.id, booking.bookingRequestId);
  if (!jobResult.ok) throw new Error(`Job creation failed: ${jobResult.error}`);
  console.log(`✓ Accepted → job ${jobResult.jobId}`);

  const job = await prisma.job.findUnique({
    where: { id: jobResult.jobId },
    include: { paymentRecord: true },
  });
  if (!job || job.status !== "scheduled") throw new Error("Job state invalid");
  if (!job.paymentRecord || job.paymentRecord.status !== "not_requested") {
    throw new Error("PaymentRecord not created on job accept");
  }
  console.log("✓ Job status scheduled + PaymentRecord not_requested");

  const manualPaid = await prisma.paymentRecord.update({
    where: { id: job.paymentRecord.id },
    data: { status: "paid", provider: "manual", paidAt: new Date() },
  });
  if (manualPaid.status !== "paid") throw new Error("Manual payment update failed");
  console.log("✓ Manual mark paid works");

  const notificationCount = await prisma.notificationLog.count({
    where: { organizationId: org.id },
  });
  const sentCount = await prisma.notificationLog.count({
    where: { organizationId: org.id, status: "sent" },
  });
  if (notificationCount < 2) {
    throw new Error(`Expected notification logs after booking (got ${notificationCount})`);
  }
  if (sentCount < 2) {
    throw new Error(`Expected sent notifications with Resend configured (got ${sentCount}/${notificationCount})`);
  }
  console.log(`✓ NotificationLog: ${sentCount} sent, ${notificationCount} total`);

  console.log("\n✓ E2E smoke test passed");
  console.log(`  Public URL: /book/${TEST_SLUG}`);
}

main()
  .catch((e) => {
    console.error("\n✗ E2E smoke FAILED:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
