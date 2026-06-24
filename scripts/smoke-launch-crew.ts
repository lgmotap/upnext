/**
 * Launch smoke: crew mobile flow — start job, check-in, checklist, photo, complete.
 * Run: npx tsx scripts/smoke-launch-crew.ts
 */
import { config } from "dotenv";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const { prisma } = await import("../lib/db/prisma");
const { assignJobToMember } = await import("../server/repositories/assignments");
const { updateJobStatus, checkInToJob } = await import("../server/services/jobs");
const {
  replaceChecklistTemplateForService,
  seedJobChecklistItems,
  setJobChecklistItemCompleted,
} = await import("../server/services/checklists");
const { uploadJobPhoto } = await import("../server/services/job-photos");

const TEST_SLUG = "smoke-test-co";

const PNG_BYTES = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function main() {
  console.log("▶ Launch crew complete smoke\n");

  const org = await prisma.organization.findFirst({
    where: { businessProfile: { publicSlug: TEST_SLUG } },
    include: { services: { where: { isAddon: false }, take: 1 } },
  });
  if (!org?.services[0]) throw new Error("Run smoke:e2e first");

  const job = await prisma.job.findFirst({
    where: { organizationId: org.id, status: { in: ["scheduled", "confirmed"] } },
    orderBy: { createdAt: "desc" },
  });
  if (!job) throw new Error("No schedulable job found");

  let worker = await prisma.membership.findFirst({
    where: { organizationId: org.id, role: "worker", status: "active" },
  });

  if (!worker) {
    const workerUserId = `launch-crew-worker-${Date.now()}`;
    await prisma.user.upsert({
      where: { id: workerUserId },
      create: { id: workerUserId, email: `crew+${workerUserId}@upnext.local`, name: "Crew Worker" },
      update: {},
    });
    worker = await prisma.membership.create({
      data: {
        organizationId: org.id,
        userId: workerUserId,
        role: "worker",
        status: "active",
      },
    });
    console.log("✓ Created worker membership for smoke");
  }

  await assignJobToMember(job.id, worker.id, org.id);
  console.log(`✓ Job ${job.id} assigned to worker`);

  await updateJobStatus(org.id, job.id, "in_progress");
  console.log("✓ Job marked in progress");

  const checkIn = await checkInToJob(org.id, job.id);
  if (!checkIn.ok) throw new Error(`Check-in failed: ${checkIn.error}`);
  console.log("✓ Check-in recorded");

  await replaceChecklistTemplateForService(org.id, job.serviceId, "Kitchen\nBathroom");
  await prisma.jobChecklistItem.deleteMany({ where: { jobId: job.id } });
  await seedJobChecklistItems(prisma, org.id, job.id, job.serviceId);

  const items = await prisma.jobChecklistItem.findMany({
    where: { jobId: job.id },
    orderBy: { sortOrder: "asc" },
  });
  if (items.length === 0) throw new Error("No checklist items");

  const toggled = await setJobChecklistItemCompleted(org.id, job.id, items[0].id, worker.id, true);
  if (!toggled.ok) throw new Error(`Checklist toggle failed: ${toggled.error}`);
  console.log("✓ Checklist item completed");

  const file = new File([PNG_BYTES], "crew-proof.png", { type: "image/png" });
  const photo = await uploadJobPhoto(org.id, job.id, worker.id, file, "after", "crew smoke");
  if (!photo.ok) throw new Error(`Photo upload failed: ${photo.error}`);
  console.log("✓ Job photo uploaded");

  await updateJobStatus(org.id, job.id, "completed");
  const done = await prisma.job.findUnique({ where: { id: job.id } });
  if (done?.status !== "completed") throw new Error("Job not completed");
  console.log("✓ Job marked complete");

  console.log("\n✓ Launch crew complete smoke passed");
}

main()
  .catch((e) => {
    console.error("\n✗ Launch crew smoke FAILED:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
