/**
 * Smoke: service-area zip/radius enforcement on public + manual booking.
 * Run: npm run smoke:service-area-enforcement
 */
import { config } from "dotenv";
import { randomUUID } from "crypto";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const {
  checkServiceArea,
  haversineMiles,
  normalizeUsZip,
  parseZipCodesInput,
} = await import("../lib/business/service-area-enforcement");
const { prisma } = await import("../lib/db/prisma");
const {
  createPublicBooking,
  getOrgAvailableDays,
  getOrgSlotsForDay,
  getPublicSlotsForDay,
  createManualBooking,
} = await import("../server/services/bookings");

const TEST_SLUG = "smoke-test-co";

function assertLib() {
  if (normalizeUsZip("78701-1234") !== "78701") throw new Error("normalizeUsZip failed");
  if (normalizeUsZip("bad") !== null) throw new Error("normalizeUsZip should reject bad");
  const zips = parseZipCodesInput("78701, 78702\n78703");
  if (zips.join(",") !== "78701,78702,78703") throw new Error("parseZipCodesInput failed");

  const austin = haversineMiles(30.2672, -97.7431, 30.5083, -97.6789);
  if (austin < 10 || austin > 25) throw new Error(`Unexpected Austin→Round Rock miles: ${austin}`);

  const inside = checkServiceArea(
    { mode: "zip_list", zipCodes: ["78701", "78702"] },
    { postalCode: "78701" },
  );
  if (!inside.ok) throw new Error("Expected zip 78701 to pass");

  const outside = checkServiceArea(
    { mode: "zip_list", zipCodes: ["78701"] },
    { postalCode: "73301" },
  );
  if (outside.ok) throw new Error("Expected zip 73301 to fail");

  console.log("✓ Pure lib checks passed");
}

async function main() {
  console.log("▶ Service area enforcement smoke\n");
  assertLib();

  const profile = await prisma.businessProfile.findFirst({
    where: { publicSlug: TEST_SLUG },
    include: { organization: true },
  });
  if (!profile) {
    console.error("✗ Smoke org not found — run smoke:launch-onboarding first");
    process.exit(1);
  }

  const service = await prisma.service.findFirst({
    where: {
      organizationId: profile.organizationId,
      isActive: true,
      isPublic: true,
      isAddon: false,
    },
  });
  if (!service) throw new Error("No service for smoke org");

  const original = {
    mode: profile.serviceAreaEnforcementMode,
    zips: profile.serviceAreaZipCodesJson,
    radius: profile.serviceAreaRadiusMiles,
    lat: profile.addressLatitude,
    lng: profile.addressLongitude,
  };

  await prisma.businessProfile.update({
    where: { id: profile.id },
    data: {
      serviceAreaEnforcementMode: "zip_list",
      serviceAreaZipCodesJson: ["78701", "78702"],
      serviceAreaRadiusMiles: null,
    },
  });

  const days = await import("../server/services/bookings").then((m) =>
    m.getPublicAvailableDays(profile.publicSlug, service.id, []),
  );
  const date = days?.days[0]?.date;
  if (!date) throw new Error("No public days available");

  const slots = await getPublicSlotsForDay(profile.publicSlug, service.id, date, []);
  const time = slots?.[0]?.time;
  if (!time) throw new Error("No public slot");

  const blocked = await createPublicBooking({
    businessSlug: profile.publicSlug,
    serviceId: service.id,
    addonServiceIds: [],
    date,
    time,
    firstName: "Out",
    lastName: "OfArea",
    email: `out-area+${randomUUID().slice(0, 6)}@upnext.local`,
    phone: "",
    line1: "1 Remote St",
    line2: "",
    city: "Dallas",
    region: "TX",
    postalCode: "75201",
    customerNotes: "",
    frequency: "one_time",
  });
  if (blocked.ok) throw new Error("Expected public booking outside zip to fail");
  if (!blocked.error.includes("75201") && !blocked.error.includes("don't serve")) {
    throw new Error(`Unexpected block message: ${blocked.error}`);
  }
  console.log("✓ Public booking blocked outside ZIP list");

  const suffix = randomUUID().slice(0, 6);
  const allowed = await createPublicBooking({
    businessSlug: profile.publicSlug,
    serviceId: service.id,
    addonServiceIds: [],
    date,
    time,
    firstName: "In",
    lastName: "Area",
    email: `in-area+${suffix}@upnext.local`,
    phone: "",
    line1: "456 Local Ave",
    line2: "",
    city: "Austin",
    region: "TX",
    postalCode: "78701",
    customerNotes: "",
    frequency: "one_time",
  });
  if (!allowed.ok) throw new Error(`Expected public booking in zip to pass: ${allowed.error}`);
  console.log("✓ Public booking allowed inside ZIP list");

  const orgDays = await getOrgAvailableDays(profile.organizationId, service.id, []);
  const manualDate = orgDays?.days[0]?.date ?? date;
  const manualSlots = await getOrgSlotsForDay(profile.organizationId, service.id, manualDate, []);
  const manualTime = manualSlots?.slots[0]?.time ?? time;

  const manualBlocked = await createManualBooking(profile.organizationId, {
    serviceId: service.id,
    addonServiceIds: [],
    date: manualDate,
    time: manualTime,
    firstName: "Manual",
    lastName: "Outside",
    email: `manual-out+${suffix}@upnext.local`,
    phone: "",
    line1: "9 Far Rd",
    line2: "",
    city: "Dallas",
    region: "TX",
    postalCode: "75201",
    customerNotes: "",
    frequency: "one_time",
    overrideServiceArea: false,
  });
  if (manualBlocked.ok) {
    throw new Error("Expected manual booking without override to fail");
  }
  if (!manualBlocked.error.includes("75201") && !manualBlocked.error.includes("don't serve")) {
    throw new Error(`Unexpected manual block message: ${manualBlocked.error}`);
  }
  console.log("✓ Manual booking blocked outside area without override");

  const manualOverride = await createManualBooking(profile.organizationId, {
    serviceId: service.id,
    addonServiceIds: [],
    date: manualDate,
    time: manualTime,
    firstName: "Manual",
    lastName: "Override",
    email: `manual-override+${suffix}@upnext.local`,
    phone: "",
    line1: "9 Far Rd",
    line2: "",
    city: "Dallas",
    region: "TX",
    postalCode: "75201",
    customerNotes: "",
    frequency: "one_time",
    overrideServiceArea: true,
  });
  if (!manualOverride.ok) {
    throw new Error(`Expected manual override booking to pass: ${manualOverride.error}`);
  }
  console.log("✓ Manual booking override succeeded");

  await prisma.businessProfile.update({
    where: { id: profile.id },
    data: {
      serviceAreaEnforcementMode: original.mode,
      serviceAreaZipCodesJson: original.zips ?? undefined,
      serviceAreaRadiusMiles: original.radius,
      addressLatitude: original.lat,
      addressLongitude: original.lng,
    },
  });
  console.log("✓ Restored profile enforcement settings");

  console.log("\n✓ Service area enforcement smoke passed");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
