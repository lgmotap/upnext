/**
 * Smoke: per-worker availability narrows manual booking slots.
 * Run: npx tsx scripts/smoke-worker-availability.ts
 */
import { config } from "dotenv";
import { randomUUID } from "crypto";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const { prisma } = await import("../lib/db/prisma");
const { createWorkspaceForNewUser } = await import("../server/services/onboarding");
const { saveWeeklyAvailability } = await import("../server/services/availability");
const { defaultWeeklyRules } = await import("../server/validators/availability");
const { saveMembershipWeeklyAvailability } = await import(
  "../server/repositories/membership-availability"
);
const { getOrgSlotsForDay } = await import("../server/services/bookings");
const { intersectWeeklyRules } = await import("../lib/availability/intersect-rules");

async function main() {
  console.log("▶ Worker availability smoke\n");

  const suffix = randomUUID().slice(0, 8);
  const { organization } = await createWorkspaceForNewUser({
    userId: `worker-avail-${suffix}`,
    email: `worker-avail+${suffix}@upnext.local`,
    name: "Worker Avail Owner",
    businessName: `Worker Avail ${suffix}`,
  });

  const orgRules = defaultWeeklyRules().map((r) =>
    r.dayOfWeek === 0 ? { ...r, isActive: false } : { ...r, isActive: true },
  );
  await saveWeeklyAvailability(organization.id, { rules: orgRules });

  const service = await prisma.service.findFirst({
    where: { organizationId: organization.id, isAddon: false },
    orderBy: { sortOrder: "asc" },
  });
  if (!service) throw new Error("No primary service");

  const worker = await prisma.membership.findFirst({
    where: { organizationId: organization.id, role: "owner" },
  });
  if (!worker) throw new Error("No membership");

  const workerRules = defaultWeeklyRules().map((r) => {
    if (r.dayOfWeek === 0) return { ...r, isActive: false };
    if (r.dayOfWeek >= 1 && r.dayOfWeek <= 5) {
      return { ...r, isActive: true, startTime: "10:00", endTime: "14:00" };
    }
    return { ...r, isActive: false };
  });
  await saveMembershipWeeklyAvailability(worker.id, workerRules);

  const intersected = intersectWeeklyRules(orgRules, workerRules);
  const wed = intersected.find((r) => r.dayOfWeek === 3);
  if (!wed?.isActive || wed.startTime !== "10:00" || wed.endTime !== "14:00") {
    throw new Error("Rule intersection failed");
  }
  console.log("✓ Org + worker hours intersect (Wed 10:00–14:00)");

  const today = new Date();
  let probeDate = "";
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    if (d.getDay() === 3) {
      probeDate = d.toISOString().slice(0, 10);
      break;
    }
  }
  if (!probeDate) throw new Error("No Wednesday in next 14 days");

  const orgSlotResult = await getOrgSlotsForDay(organization.id, service.id, probeDate);
  const orgSlots = orgSlotResult?.slots ?? [];
  const workerSlotResult = await getOrgSlotsForDay(
    organization.id,
    service.id,
    probeDate,
    [],
    worker.id,
  );
  const workerSlots = workerSlotResult?.slots ?? [];

  if (orgSlots.length === 0) throw new Error("Expected org slots on Wednesday");
  if (workerSlots.length === 0) throw new Error("Expected worker-filtered slots");
  if (workerSlots.length >= orgSlots.length) {
    throw new Error(
      `Worker slots (${workerSlots.length}) should be fewer than org slots (${orgSlots.length})`,
    );
  }

  const orgMorning = orgSlots.some((s) => s.time === "08:00");
  const workerMorning = workerSlots.some((s) => s.time === "08:00");
  if (!orgMorning) console.log("⚠ Org has no 08:00 slot on probe Wednesday (OK if min notice)");
  if (workerMorning) throw new Error("Worker should not have 08:00 slot when hours start at 10:00");

  console.log(`✓ Wednesday ${probeDate}: org ${orgSlots.length} slots, worker ${workerSlots.length} slots`);
  console.log("\n✅ Worker availability smoke passed");
}

main()
  .catch((e) => {
    console.error("✗", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
