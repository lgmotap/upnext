/**
 * Smoke: multi-location v1 — default location, second location, booking tagging.
 * Run: npm run smoke:locations
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
const {
  ensureDefaultLocationForOrg,
  getPublicLocationOptions,
  resolveLocationIdForBooking,
} = await import("../server/services/locations");
const { createLocationForOrg } = await import("../server/repositories/locations");

const TEST_SLUG = "smoke-test-co";

async function main() {
  console.log("▶ Multi-location smoke test\n");

  const org = await prisma.organization.findFirst({
    where: { businessProfile: { publicSlug: TEST_SLUG } },
    include: { services: true },
  });
  if (!org) throw new Error("Run smoke:e2e first to seed smoke-test-co org");

  await prisma.businessProfile.update({
    where: { organizationId: org.id },
    data: { serviceAreaEnforcementMode: "off" },
  });

  const defaultLoc = await ensureDefaultLocationForOrg(org.id);
  if (!defaultLoc) throw new Error("Default location not created");

  let second = await prisma.location.findFirst({
    where: { organizationId: org.id, name: "Smoke North Branch" },
  });
  if (!second) {
    second = await createLocationForOrg(org.id, {
      name: "Smoke North Branch",
      isActive: true,
      city: "Testville",
      region: "NY",
      addressLine1: "100 North St",
      postalCode: "10001",
    });
  }

  const options = await getPublicLocationOptions(org.id);
  if (options.length < 2) throw new Error(`Expected 2+ locations, got ${options.length}`);

  const resolved = await resolveLocationIdForBooking(org.id, second.id);
  if (!resolved.ok || resolved.locationId !== second.id) {
    throw new Error("resolveLocationIdForBooking failed for second location");
  }

  const service = org.services.find((s) => s.isActive && !s.isAddon) ?? org.services[0];
  if (!service) throw new Error("No active service");

  await saveWeeklyAvailability(org.id, { rules: defaultWeeklyRules() });

  const daysResult = await getOrgAvailableDays(org.id, service.id);
  const days = daysResult?.days ?? [];
  if (days.length === 0) throw new Error("No available days");

  let slotDate = "";
  let slotTime = "";
  for (const day of days.slice(0, 14)) {
    const slotResult = await getOrgSlotsForDay(org.id, service.id, day.date);
    const slots = slotResult?.slots ?? [];
    if (slots.length > 0) {
      slotDate = day.date;
      slotTime = slots[0].time;
      break;
    }
  }
  if (!slotDate || !slotTime) throw new Error("No slots");

  const result = await createManualBooking(org.id, {
    serviceId: service.id,
    addonServiceIds: [],
    date: slotDate,
    time: slotTime,
    frequency: "one_time",
    locationId: second.id,
    firstName: "Loc",
    lastName: "Smoke",
    email: `loc-smoke+${Date.now()}@upnext.local`,
    phone: "",
    line1: "200 Branch Ave",
    line2: "",
    city: "Testville",
    region: "NY",
    postalCode: "10001",
    customerNotes: "Multi-location smoke",
    assignMembershipId: "",
  });

  if (!result.ok) throw new Error(`Manual booking failed: ${result.error}`);

  const booking = await prisma.bookingRequest.findUnique({
    where: { id: result.bookingRequestId },
    include: { job: true },
  });
  if (!booking?.locationId || booking.locationId !== second.id) {
    throw new Error(`Booking missing locationId (got ${booking?.locationId})`);
  }
  if (!booking.job?.locationId || booking.job.locationId !== second.id) {
    throw new Error(`Job missing locationId (got ${booking.job?.locationId})`);
  }

  console.log(`✓ Default location: ${defaultLoc.name}`);
  console.log(`✓ Public options: ${options.length} locations`);
  console.log(`✓ Manual booking tagged to ${second.name} → job ${result.jobId}`);
  console.log("\n✅ Multi-location smoke passed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
