/**
 * Verifies pricing-parameter booking works when counts are omitted (defaults applied).
 */
import { config } from "dotenv";
import { randomUUID } from "crypto";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const { prisma } = await import("../lib/db/prisma");
const { getPublicAvailableDays, getPublicSlotsForDay, createPublicBooking } = await import(
  "../server/services/bookings"
);

const slug = process.argv[2] ?? "cleaning-bot";

const profile = await prisma.businessProfile.findFirst({
  where: { publicSlug: slug },
});
if (!profile) throw new Error(`No business profile for slug ${slug}`);

const service = await prisma.service.findFirst({
  where: { organizationId: profile.organizationId, isAddon: false },
  orderBy: { sortOrder: "asc" },
});
if (!service) throw new Error("No primary service");

const days = (await getPublicAvailableDays(slug, service.id))?.days ?? [];
if (!days[0]) throw new Error("No bookable days");
const slots = (await getPublicSlotsForDay(slug, service.id, days[0].date)) ?? [];
if (!slots[0]) throw new Error("No slots");

const result = await createPublicBooking({
  businessSlug: slug,
  serviceId: service.id,
  addonServiceIds: [],
  date: days[0].date,
  time: slots[0].time,
  firstName: "Bed",
  lastName: "Bath",
  email: `bedbath-defaults+${randomUUID().slice(0, 8)}@upnext.local`,
  phone: "",
  line1: "1 Test St",
  city: "Austin",
  region: "TX",
  postalCode: "78701",
  frequency: "one_time",
});

if (!result.ok) throw new Error(`Expected booking to succeed with defaults: ${result.error}`);
console.log(`✅ Pricing parameter defaults smoke passed (${result.bookingRequestId})`);

await prisma.$disconnect();
