/**
 * Launch smoke: sign-up workspace → onboarding → add service → public booking.
 * Run: npx tsx scripts/smoke-launch-onboarding.ts
 */
import { config } from "dotenv";
import { randomUUID } from "crypto";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const { prisma } = await import("../lib/db/prisma");
const { createWorkspaceForNewUser } = await import("../server/services/onboarding");
const { updateBusinessSetup } = await import("../server/services/business");
const { ensureIndustryCatalogForOrg } = await import("../server/services/industry-catalog");
const { catalogStats } = await import("../lib/onboarding/industry-catalog");
const { saveWeeklyAvailability } = await import("../server/services/availability");
const { defaultWeeklyRules } = await import("../server/validators/availability");
const { getPublicAvailableDays, getPublicSlotsForDay, createPublicBooking } = await import(
  "../server/services/bookings"
);

async function main() {
  console.log("▶ Launch onboarding → service → book smoke\n");

  const suffix = randomUUID().slice(0, 8);
  const businessName = `Launch Smoke ${suffix}`;
  const userId = `launch-smoke-${suffix}`;
  const email = `launch-smoke+${suffix}@upnext.local`;

  const { organization, businessProfile } = await createWorkspaceForNewUser({
    userId,
    email,
    name: "Launch Smoke Owner",
    businessName,
  });
  console.log(`✓ Workspace provisioned (org ${organization.id})`);

  const expected = catalogStats("Residential Cleaning");
  const primaryAfterSignup = await prisma.service.count({
    where: { organizationId: organization.id, isAddon: false },
  });
  if (primaryAfterSignup < expected.primaryCount) {
    throw new Error(
      `Expected ${expected.primaryCount} primary services at signup, got ${primaryAfterSignup}`,
    );
  }
  console.log(`✓ Default catalog at signup: ${primaryAfterSignup} services`);

  await updateBusinessSetup(organization.id, {
    businessType: "Residential Cleaning",
    teamSize: "Just me",
    addressLine1: "100 Launch Lane",
    addressLine2: "",
    city: "Launchville",
    region: "NY",
    postalCode: "10001",
    country: "US",
    displayName: businessName,
    timezone: "America/New_York",
    currency: "USD",
    serviceArea: "Launch City",
    phone: "555-0100",
    description: "Launch smoke test business",
  });
  console.log("✓ Onboarding business setup saved");

  const seeded = await ensureIndustryCatalogForOrg(organization.id);
  const serviceCount = await prisma.service.count({ where: { organizationId: organization.id } });
  if (serviceCount < expected.totalCount) {
    throw new Error(`Expected ${expected.totalCount} catalog services, got ${serviceCount}`);
  }
  console.log(
    `✓ Catalog complete: ${expected.primaryCount} services + ${expected.addonCount} add-ons` +
      (seeded.seeded ? " (added missing)" : ""),
  );

  const service = await prisma.service.findFirst({
    where: { organizationId: organization.id, isAddon: false },
    orderBy: { sortOrder: "asc" },
  });
  if (!service) throw new Error("No primary service after catalog seed");

  await saveWeeklyAvailability(organization.id, { rules: defaultWeeklyRules() });
  console.log("✓ Default availability saved");

  const slug = businessProfile.publicSlug;
  const bookingPath = `/book/${slug}`;
  console.log(`✓ Booking link: ${bookingPath}`);

  const daysResult = await getPublicAvailableDays(slug, service.id);
  const days = daysResult?.days ?? [];
  if (days.length === 0) throw new Error("No bookable days after setup");
  console.log(`✓ ${days.length} bookable days on public page`);

  const slots = (await getPublicSlotsForDay(slug, service.id, days[0].date)) ?? [];
  if (slots.length === 0) throw new Error("No slots on first day");
  console.log(`✓ ${slots.length} slots on ${days[0].date}`);

  const booking = await createPublicBooking({
    businessSlug: slug,
    serviceId: service.id,
    addonServiceIds: [],
    date: days[0].date,
    time: slots[0].time,
    firstName: "Launch",
    lastName: "Customer",
    email: `launch-customer+${suffix}@upnext.local`,
    phone: "",
    line1: "100 Launch Lane",
    line2: "",
    city: "Launchville",
    region: "NY",
    postalCode: "10001",
    customerNotes: "Launch smoke booking",
    bedrooms: 3,
    bathrooms: 2,
  });

  if (!booking.ok) throw new Error(`Public booking failed: ${booking.error}`);
  console.log(`✓ Customer booked via ${bookingPath} → ${booking.bookingRequestId}`);

  const pending = await prisma.bookingRequest.count({
    where: { organizationId: organization.id, status: "pending" },
  });
  if (pending < 1) throw new Error("Expected pending booking in inbox");
  console.log(`✓ Owner inbox has ${pending} pending request(s)`);

  console.log("\n✓ Launch onboarding smoke passed");
}

main()
  .catch((e) => {
    console.error("\n✗ Launch onboarding smoke FAILED:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
