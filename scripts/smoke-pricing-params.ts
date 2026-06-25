/**
 * Smoke: bed/bath pricing parameters on public booking → accepted job price.
 * Run: npm run smoke:pricing-params
 */
import { config } from "dotenv";
import { randomUUID } from "crypto";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const { prisma } = await import("../lib/db/prisma");
const { saveWeeklyAvailability } = await import("../server/services/availability");
const { defaultWeeklyRules } = await import("../server/validators/availability");
const { replaceServicePricingParameters } = await import("../server/repositories/pricing-parameters");
const { getPublicAvailableDays, getPublicSlotsForDay, createPublicBooking } = await import(
  "../server/services/bookings"
);
const { createJobFromBookingRequest } = await import("../server/services/jobs");
const { RESIDENTIAL_CLEANING_PRICING_PARAMS } = await import("../lib/onboarding/industry-catalog");
const { calculatePricingParameterTotal } = await import("../lib/pricing/parameters");

const TEST_SLUG = "smoke-pricing-params";
const TEST_USER_ID = "smoke-pricing-params-user";

async function main() {
  console.log("▶ Pricing parameters smoke\n");

  let org = await prisma.organization.findFirst({
    where: { businessProfile: { publicSlug: TEST_SLUG } },
    include: { businessProfile: true, services: true },
  });

  if (!org) {
    const user = await prisma.user.upsert({
      where: { id: TEST_USER_ID },
      create: { id: TEST_USER_ID, email: "smoke-pricing@upnext.local", name: "Pricing Smoke" },
      update: {},
    });

    org = await prisma.organization.create({
      data: {
        name: "Pricing Smoke Co",
        slug: `pricing-smoke-${randomUUID().slice(0, 8)}`,
        ownerId: user.id,
        timezone: "America/New_York",
        memberships: {
          create: { userId: user.id, role: "owner", status: "active" },
        },
        businessProfile: {
          create: {
            displayName: "Pricing Smoke Co",
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

  const service = org.services[0] ?? (await prisma.service.findFirst({ where: { organizationId: org.id } }));
  if (!service) throw new Error("No service");

  await replaceServicePricingParameters(service.id, RESIDENTIAL_CLEANING_PRICING_PARAMS);
  await saveWeeklyAvailability(org.id, { rules: defaultWeeklyRules() });
  console.log("✓ Service has home-size pricing params");

  const daysResult = await getPublicAvailableDays(TEST_SLUG, service.id);
  const days = daysResult?.days ?? [];
  if (days.length === 0) throw new Error("No available days");

  const date = days[0]!.date;
  const slots = (await getPublicSlotsForDay(TEST_SLUG, service.id, date)) ?? [];
  if (slots.length === 0) throw new Error("No slots");

  const bedrooms = 4;
  const bathrooms = 2;
  const half_bathrooms = 1;
  const square_feet = 2000;
  const expectedSurcharge = calculatePricingParameterTotal(RESIDENTIAL_CLEANING_PRICING_PARAMS, {
    bedrooms,
    bathrooms,
    half_bathrooms,
    square_feet,
  });
  const expectedPrice = service.basePriceCents + expectedSurcharge;

  const result = await createPublicBooking({
    businessSlug: TEST_SLUG,
    serviceId: service.id,
    addonServiceIds: [],
    date,
    time: slots[0]!.time,
    firstName: "Pat",
    lastName: "Price",
    email: `pricing-smoke+${randomUUID().slice(0, 8)}@upnext.local`,
    line1: "1 Test St",
    city: "Austin",
    region: "TX",
    postalCode: "78701",
    frequency: "one_time",
    bedrooms,
    bathrooms,
    half_bathrooms,
    square_feet,
  });

  if (!result.ok) throw new Error(result.error);
  console.log(`✓ Booking created: ${result.bookingRequestId}`);

  const accept = await createJobFromBookingRequest(org.id, result.bookingRequestId);
  if (!accept.ok) throw new Error(accept.error);

  const job = await prisma.job.findUnique({ where: { id: accept.jobId } });
  if (!job) throw new Error("Job missing");
  if (job.priceCents !== expectedPrice) {
    throw new Error(`Expected price ${expectedPrice}, got ${job.priceCents}`);
  }

  console.log(
    `✓ Job price ${job.priceCents} (${bedrooms} bed, ${bathrooms} bath, ${half_bathrooms} half-bath, ${square_feet} sq ft)`,
  );
  console.log("\n✅ Pricing parameters smoke passed");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
