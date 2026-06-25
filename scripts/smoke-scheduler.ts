/**
 * Smoke: scheduler reschedule via service (same as drag-drop action).
 * Run: npm run smoke:scheduler
 */
import { config } from "dotenv";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const { prisma } = await import("../lib/db/prisma");
const {
  getRescheduleDaysForJob,
  getRescheduleSlotsForJob,
  rescheduleJob,
} = await import("../server/services/scheduling");
const { formatYmdInTimezone, formatTimeHmInTimezone } = await import("../lib/datetime/timezone");
const { detectScheduleConflicts } = await import("../lib/scheduling/conflicts");

const TEST_SLUG = "smoke-test-co";

async function main() {
  console.log("▶ Dispatch scheduler smoke\n");

  const org = await prisma.organization.findFirst({
    where: { businessProfile: { publicSlug: TEST_SLUG } },
    select: { id: true, timezone: true },
  });
  if (!org) throw new Error("Run smoke:e2e first — missing smoke-test-co org");

  const job = await prisma.job.findFirst({
    where: { organizationId: org.id, status: { in: ["scheduled", "confirmed"] } },
    orderBy: { createdAt: "desc" },
  });
  if (!job) throw new Error("No schedulable job");

  const days = await getRescheduleDaysForJob(org.id, job.id);
  if (!days?.days.length) throw new Error("No reschedule days");

  const targetDate =
    days.days.find((d) => d.date !== formatYmdInTimezone(job.scheduledStartAt, org.timezone))?.date ??
    days.days[0].date;
  const slots = await getRescheduleSlotsForJob(org.id, job.id, targetDate);
  if (!slots?.length) throw new Error("No slots on target date");

  const slot = slots.find((s) => s.time !== formatTimeHmInTimezone(job.scheduledStartAt, org.timezone)) ?? slots[0];
  const before = job.scheduledStartAt.toISOString();

  const result = await rescheduleJob(org.id, job.id, slot.date, slot.time);
  if (!result.ok) throw new Error(result.error);

  const updated = await prisma.job.findUniqueOrThrow({ where: { id: job.id } });
  if (updated.scheduledStartAt.toISOString() === before) {
    throw new Error("scheduledStartAt unchanged after scheduler move");
  }
  console.log(`✓ Job moved to ${slot.date} ${slot.time}`);

  const base = new Date("2026-06-15T10:00:00.000Z");
  const conflicts = detectScheduleConflicts(
    [
      {
        id: "a",
        scheduledStartAt: base,
        scheduledEndAt: new Date(base.getTime() + 60 * 60_000),
        status: "scheduled",
        membershipId: "worker-1",
        customerLabel: "Alice",
      },
      {
        id: "b",
        scheduledStartAt: new Date(base.getTime() + 30 * 60_000),
        scheduledEndAt: new Date(base.getTime() + 90 * 60_000),
        status: "scheduled",
        membershipId: "worker-1",
        customerLabel: "Bob",
      },
      {
        id: "c",
        scheduledStartAt: base,
        scheduledEndAt: new Date(base.getTime() + 60 * 60_000),
        status: "scheduled",
        membershipId: "worker-2",
        customerLabel: "Carol",
      },
    ],
    { bufferMinutesBetweenJobs: 0, providerCarryOverMinutes: 0 },
  );
  if (!conflicts.get("a")?.some((o) => o.jobId === "b")) {
    throw new Error("Expected worker overlap conflict between jobs a and b");
  }
  if (conflicts.has("c")) throw new Error("Different workers should not conflict");
  console.log("✓ detectScheduleConflicts worker overlap");

  console.log("\n✅ Scheduler smoke passed");
}

main()
  .catch((e) => {
    console.error("✗", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
