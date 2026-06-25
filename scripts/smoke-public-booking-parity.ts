/**
 * Smoke: public booking parity — frequency saved, prefill params, embed route.
 * Run: npx tsx scripts/smoke-public-booking-parity.ts
 */
import { config } from "dotenv";
import { randomUUID } from "crypto";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const { prisma } = await import("../lib/db/prisma");
const { parsePublicPrefillFromSearchParams } = await import("../lib/booking/public-prefill");
const { loadPublicBookingPage } = await import("../server/services/public-booking-page");
const { createPublicBooking } = await import("../server/services/bookings");
const { getBookingEmbedUrl } = await import("../lib/url/app");

async function main() {
  console.log("▶ Public booking parity smoke\n");

  const profile = await prisma.businessProfile.findFirst({
    where: {
      bookingEnabled: true,
      organization: {
        services: { some: { isActive: true, isPublic: true, isAddon: false } },
      },
    },
    orderBy: { createdAt: "desc" },
    select: { publicSlug: true, organizationId: true, displayName: true },
  });
  if (!profile?.publicSlug) throw new Error("No bookable business profile");

  const service = await prisma.service.findFirst({
    where: { organizationId: profile.organizationId, isActive: true, isPublic: true, isAddon: false },
  });
  if (!service) throw new Error("No public primary service");

  const page = await loadPublicBookingPage(profile.publicSlug, {}, { embedded: true });
  if (page.kind !== "ready") throw new Error(`Expected ready page, got ${page.kind}`);
  if (!page.embedded) throw new Error("Embedded flag not set");

  const embedUrl = getBookingEmbedUrl(profile.publicSlug);
  if (!embedUrl.endsWith("/embed")) throw new Error(`Bad embed URL: ${embedUrl}`);

  const prefill = parsePublicPrefillFromSearchParams({
    firstName: "Smoke",
    lastName: "Test",
    email: `parity+${randomUUID().slice(0, 6)}@upnext.local`,
    line1: "123 Test St",
    city: "Austin",
    region: "TX",
    postalCode: "78701",
  });
  if (!prefill?.email) throw new Error("Prefill parse failed");

  const loaded = await loadPublicBookingPage(profile.publicSlug, {
    firstName: "Smoke",
    lastName: "Guest",
    email: prefill.email,
    line1: "1 Main",
    city: "Austin",
    region: "TX",
    postalCode: "78701",
  });
  if (loaded.kind !== "ready" || !loaded.prefill?.email) {
    throw new Error("Query param prefill not applied");
  }

  const days = page.initialDays;
  const date = days[0]?.date;
  if (!date) throw new Error("No available days for booking");

  const { getPublicSlotsForDay } = await import("../server/services/bookings");
  const slots = await getPublicSlotsForDay(profile.publicSlug, service.id, date, []);
  const time = slots?.[0]?.time;
  if (!time) throw new Error("No slot available");

  const suffix = randomUUID().slice(0, 6);
  const result = await createPublicBooking({
    businessSlug: profile.publicSlug,
    serviceId: service.id,
    addonServiceIds: [],
    date,
    time,
    firstName: "Parity",
    lastName: `Smoke${suffix}`,
    email: `parity-smoke+${suffix}@upnext.local`,
    phone: "",
    line1: "456 Booking Ave",
    line2: "",
    city: "Austin",
    region: "TX",
    postalCode: "78702",
    customerNotes: "",
    frequency: "biweekly",
  });

  if (!result.ok) throw new Error(`Booking failed: ${result.error}`);

  const saved = await prisma.bookingRequest.findUnique({
    where: { id: result.bookingRequestId },
    select: { frequency: true },
  });
  if (saved?.frequency !== "biweekly") {
    throw new Error(`Expected biweekly frequency, got ${saved?.frequency}`);
  }

  console.log(`✓ Business: ${profile.displayName}`);
  console.log(`✓ Embed URL: ${embedUrl}`);
  console.log(`✓ Query prefill OK`);
  console.log(`✓ Booking created with frequency=biweekly`);
  console.log("\n✅ Public booking parity smoke passed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
