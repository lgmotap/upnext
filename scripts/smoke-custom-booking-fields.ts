/**
 * Smoke: custom booking form field → public book → value on booking.
 * Run: npm run smoke:custom-booking-fields
 */
import { config } from "dotenv";
import { randomUUID } from "crypto";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const { prisma } = await import("../lib/db/prisma");
const { saveWeeklyAvailability } = await import("../server/services/availability");
const { defaultWeeklyRules } = await import("../server/validators/availability");
const { createBookingFormField } = await import("../server/repositories/booking-form-fields");
const { getPublicAvailableDays, getPublicSlotsForDay, createPublicBooking } = await import(
  "../server/services/bookings"
);

const TEST_SLUG = "smoke-custom-fields";
const FIELD_KEY = "gate_code";
const FIELD_VALUE = "1234#";

async function main() {
  console.log("▶ Custom booking fields smoke\n");

  let org = await prisma.organization.findFirst({
    where: { businessProfile: { publicSlug: TEST_SLUG } },
    include: { businessProfile: true, services: true },
  });

  if (!org) {
    const userId = `smoke-cf-${randomUUID().slice(0, 8)}`;
    const user = await prisma.user.create({
      data: {
        id: userId,
        email: `smoke-cf-${randomUUID().slice(0, 6)}@upnext.local`,
        name: "Custom Fields Smoke",
      },
    });
    org = await prisma.organization.create({
      data: {
        name: "Custom Fields Smoke Co",
        slug: `cf-smoke-${randomUUID().slice(0, 8)}`,
        ownerId: user.id,
        timezone: "America/New_York",
        memberships: { create: { userId: user.id, role: "owner", status: "active" } },
        businessProfile: {
          create: {
            displayName: "Custom Fields Smoke Co",
            publicSlug: TEST_SLUG,
            bookingEnabled: true,
          },
        },
        services: {
          create: {
            name: "Standard Clean",
            durationMinutes: 120,
            basePriceCents: 15000,
            isActive: true,
            isPublic: true,
          },
        },
      },
      include: { businessProfile: true, services: true },
    });
    console.log("✓ Seeded test org");
  }

  await prisma.bookingFormField.deleteMany({ where: { organizationId: org.id } });
  await createBookingFormField(org.id, {
    key: FIELD_KEY,
    label: "Gate code",
    fieldType: "text",
    required: true,
    sortOrder: 0,
  });
  console.log("✓ Custom field created");

  await saveWeeklyAvailability(org.id, { rules: defaultWeeklyRules() });

  const service = org.services[0] ?? (await prisma.service.findFirst({ where: { organizationId: org.id } }));
  if (!service) throw new Error("No service");

  const daysResult = await getPublicAvailableDays(TEST_SLUG, service.id);
  const days = daysResult?.days ?? [];
  if (days.length === 0) throw new Error("No available days");
  const date = days[0].date;
  const slots = (await getPublicSlotsForDay(TEST_SLUG, service.id, date)) ?? [];
  if (slots.length === 0) throw new Error("No slots");

  const result = await createPublicBooking({
    businessSlug: TEST_SLUG,
    serviceId: service.id,
    addonServiceIds: [],
    date,
    time: slots[0].time,
    firstName: "Test",
    lastName: "Customer",
    email: `cf-${randomUUID().slice(0, 6)}@example.com`,
    phone: "+15555550999",
    line1: "123 Main St",
    city: "Austin",
    region: "TX",
    postalCode: "78701",
    frequency: "one_time",
    customFieldsJson: { [FIELD_KEY]: FIELD_VALUE },
  });

  if (!result.ok) throw new Error(result.error);
  console.log(`✓ Public booking created ${result.bookingRequestId}`);

  const booking = await prisma.bookingRequest.findUniqueOrThrow({
    where: { id: result.bookingRequestId },
    select: { customFieldsJson: true },
  });
  const stored = booking.customFieldsJson as Record<string, string> | null;
  if (stored?.[FIELD_KEY] !== FIELD_VALUE) {
    throw new Error(`Expected custom field ${FIELD_VALUE}, got ${JSON.stringify(stored)}`);
  }
  console.log("✓ customFieldsJson persisted");

  const customer = await prisma.customer.findFirst({
    where: { organizationId: org.id },
    include: { addresses: { take: 1 } },
  });
  if (!customer?.addresses[0]) throw new Error("Need customer with address for manual smoke");

  const manualResult = await (
    await import("../server/services/bookings")
  ).createManualBooking(org.id, {
    serviceId: service.id,
    addonServiceIds: [],
    date,
    time: slots[0].time,
    frequency: "one_time",
    customerId: customer.id,
    customerAddressId: customer.addresses[0].id,
    customFieldsJson: { [FIELD_KEY]: `${FIELD_VALUE}-manual` },
  });
  if (!manualResult.ok) throw new Error(`Manual booking failed: ${manualResult.error}`);
  const manualBooking = await prisma.bookingRequest.findUniqueOrThrow({
    where: { id: manualResult.bookingRequestId },
    select: { customFieldsJson: true, source: true },
  });
  const manualStored = manualBooking.customFieldsJson as Record<string, string> | null;
  if (manualStored?.[FIELD_KEY] !== `${FIELD_VALUE}-manual`) {
    throw new Error(`Manual custom field missing: ${JSON.stringify(manualStored)}`);
  }
  if (manualBooking.source !== "manual") throw new Error("Expected manual source");
  console.log("✓ Manual booking customFieldsJson persisted");

  console.log("\n✅ Custom booking fields smoke passed");
}

main()
  .catch((e) => {
    console.error("✗", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
