/**
 * Smoke: service checklist template → job items → toggle completion.
 * Run: npx tsx scripts/smoke-checklist.ts
 */
import { config } from "dotenv";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const { prisma } = await import("../lib/db/prisma");
const { replaceChecklistTemplateForService, setJobChecklistItemCompleted } = await import(
  "../server/services/checklists"
);
const { seedJobChecklistItems } = await import("../server/services/checklists");

const TEST_SLUG = "smoke-test-co";

async function main() {
  console.log("▶ Checklist smoke test\n");

  const org = await prisma.organization.findFirst({
    where: { businessProfile: { publicSlug: TEST_SLUG } },
    include: { services: { where: { isAddon: false }, take: 1 } },
  });
  if (!org?.services[0]) {
    console.error("✗ Smoke org/service not found — run smoke:e2e first");
    process.exit(1);
  }

  const service = org.services[0];
  await replaceChecklistTemplateForService(
    org.id,
    service.id,
    "Kitchen counters\nBathrooms\nVacuum floors",
  );

  const job = await prisma.job.findFirst({
    where: { organizationId: org.id, serviceId: service.id },
    orderBy: { createdAt: "desc" },
  });
  if (!job) {
    console.error("✗ No job found for smoke org");
    process.exit(1);
  }

  await prisma.jobChecklistItem.deleteMany({ where: { jobId: job.id } });
  await seedJobChecklistItems(prisma, org.id, job.id, service.id);

  const items = await prisma.jobChecklistItem.findMany({
    where: { jobId: job.id },
    orderBy: { sortOrder: "asc" },
  });
  if (items.length !== 3) {
    console.error(`✗ Expected 3 checklist items, got ${items.length}`);
    process.exit(1);
  }
  console.log(`✓ Seeded ${items.length} checklist items on job ${job.id}`);

  const membership = await prisma.membership.findFirst({
    where: { organizationId: org.id, role: "owner" },
  });
  if (!membership) {
    console.error("✗ Owner membership not found");
    process.exit(1);
  }

  const toggle = await setJobChecklistItemCompleted(org.id, job.id, items[0].id, membership.id, true);
  if (!toggle.ok) {
    console.error("✗ Toggle failed:", toggle.error);
    process.exit(1);
  }

  const updated = await prisma.jobChecklistItem.findUnique({ where: { id: items[0].id } });
  if (!updated?.isCompleted || !updated.completedAt) {
    console.error("✗ Item not marked completed");
    process.exit(1);
  }
  console.log("✓ Toggle completion works");

  console.log("\n✓ Checklist smoke test passed");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
