/**
 * Smoke: owner reschedule + crew on-the-way / running-late notifications.
 * Run: npx tsx scripts/smoke-scheduling.ts
 */
import { config } from "dotenv";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const { prisma } = await import("../lib/db/prisma");
const { getRescheduleDaysForJob, getRescheduleSlotsForJob, rescheduleJob } = await import(
  "../server/services/scheduling"
);
const { notifyJobOnTheWay, notifyJobRunningLate } = await import("../server/services/notifications");
const { formatYmdInTimezone } = await import("../lib/datetime/timezone");

const TEST_SLUG = "smoke-test-co";

async function main() {
  console.log("▶ Scheduling + crew status smoke\n");

  const org = await prisma.organization.findFirst({
    where: { businessProfile: { publicSlug: TEST_SLUG } },
    select: { id: true, timezone: true },
  });
  if (!org) throw new Error("Run smoke:e2e first — missing smoke-test-co org");

  const job = await prisma.job.findFirst({
    where: { organizationId: org.id, status: { in: ["scheduled", "confirmed"] } },
    orderBy: { createdAt: "desc" },
    include: { customer: true },
  });
  if (!job) throw new Error("No schedulable job found");

  const days = await getRescheduleDaysForJob(org.id, job.id);
  if (!days?.days.length) throw new Error("No reschedule days");
  console.log(`✓ ${days.days.length} reschedule days for job`);

  const targetDate =
    days.days.find((d) => d.date !== formatYmdInTimezone(job.scheduledStartAt, org.timezone))?.date ??
    days.days[0].date;
  const slots = await getRescheduleSlotsForJob(org.id, job.id, targetDate);
  if (!slots?.length) throw new Error("No slots on target date");
  const slot = slots[0];
  console.log(`✓ Reschedule slot ${slot.date} ${slot.time}`);

  const before = job.scheduledStartAt.toISOString();
  const result = await rescheduleJob(org.id, job.id, slot.date, slot.time);
  if (!result.ok) throw new Error(result.error);

  const updated = await prisma.job.findUniqueOrThrow({ where: { id: job.id } });
  if (updated.scheduledStartAt.toISOString() === before) {
    throw new Error("Job start time did not change");
  }
  console.log("✓ Job rescheduled");

  const logRescheduled = await prisma.notificationLog.findFirst({
    where: { organizationId: org.id, template: "job_rescheduled", relatedId: job.id },
    orderBy: { sentAt: "desc" },
  });
  if (!logRescheduled) throw new Error("Missing job_rescheduled notification log");
  console.log(`✓ job_rescheduled logged (${logRescheduled.status})`);

  await notifyJobOnTheWay(org.id, job.id);
  const onTheWay = await prisma.notificationLog.findFirst({
    where: { organizationId: org.id, template: "job_on_the_way", relatedId: job.id },
    orderBy: { sentAt: "desc" },
  });
  if (!onTheWay) throw new Error("Missing job_on_the_way notification log");
  console.log(`✓ job_on_the_way logged (${onTheWay.status})`);

  await notifyJobRunningLate(org.id, job.id, 15);
  const late = await prisma.notificationLog.findFirst({
    where: { organizationId: org.id, template: "job_running_late", relatedId: job.id },
    orderBy: { sentAt: "desc" },
  });
  if (!late) throw new Error("Missing job_running_late notification log");
  console.log(`✓ job_running_late logged (${late.status})`);

  console.log("\n✅ Scheduling smoke passed");
}

main()
  .catch((e) => {
    console.error("✗", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
