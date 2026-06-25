/**
 * Smoke: recurring JobSeries creation + cron generation.
 * Run: npx tsx scripts/smoke-recurring.ts
 */
import { config } from "dotenv";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const { prisma } = await import("../lib/db/prisma");
const { processDueJobSeries } = await import("../server/services/recurring-jobs");
const { createJobFromBookingRequest } = await import("../server/services/jobs");
const { localDateTimeToUtc } = await import("../lib/datetime/timezone");
const { saveWeeklyAvailability } = await import("../server/services/availability");
const { defaultWeeklyRules } = await import("../server/validators/availability");
const { getOrgAvailableDays, getOrgSlotsForDay } = await import("../server/services/bookings");
const { createBookingRequest } = await import("../server/repositories/bookings");

async function main() {
  console.log("▶ Recurring jobs smoke\n");

  const org = await prisma.organization.findFirst({
    where: { businessProfile: { publicSlug: "smoke-test-co" } },
    include: {
      businessProfile: true,
      services: { where: { isActive: true, isAddon: false }, take: 1 },
    },
  });
  if (!org?.businessProfile) throw new Error("Run smoke:e2e first");
  const service = org.services[0];
  if (!service) throw new Error("No service");

  await saveWeeklyAvailability(org.id, { rules: defaultWeeklyRules() });
  const days = (await getOrgAvailableDays(org.id, service.id))?.days ?? [];
  if (days.length === 0) throw new Error("No days");
  const slotResult = await getOrgSlotsForDay(org.id, service.id, days[0].date);
  const slots = slotResult?.slots ?? [];
  if (slots.length === 0) throw new Error("No slots");

  const customer = await prisma.customer.findFirst({
    where: { organizationId: org.id },
    orderBy: { createdAt: "desc" },
  });
  if (!customer) throw new Error("No customer");

  const start = localDateTimeToUtc(days[0].date, slots[0].time, org.timezone);
  const end = new Date(start.getTime() + service.durationMinutes * 60_000);

  const booking = await createBookingRequest({
    organizationId: org.id,
    customerId: customer.id,
    serviceId: service.id,
    requestedStartAt: start,
    requestedEndAt: end,
    frequency: "weekly",
    source: "manual",
  });

  const accepted = await createJobFromBookingRequest(org.id, booking.id);
  if (!accepted.ok) throw new Error(`Accept failed: ${accepted.error}`);

  const series = await prisma.jobSeries.findFirst({
    where: { organizationId: org.id, anchorJobId: accepted.jobId },
  });
  if (!series) throw new Error("JobSeries not created");

  console.log(`✓ Series ${series.id} frequency=${series.frequency}`);
  console.log(`✓ Next occurrence: ${series.nextOccurrenceAt.toISOString()}`);

  await prisma.jobSeries.update({
    where: { id: series.id },
    data: { nextOccurrenceAt: new Date(Date.now() - 60_000) },
  });

  const cron = await processDueJobSeries(new Date());
  if (cron.generated < 1) throw new Error(`Cron did not generate job: ${JSON.stringify(cron)}`);

  const childJob = await prisma.job.findFirst({
    where: { jobSeriesId: series.id, id: { not: accepted.jobId } },
  });
  if (!childJob) throw new Error("Child job not found");

  console.log(`✓ Generated job ${childJob.id}`);
  console.log("\n✅ Recurring jobs smoke passed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
