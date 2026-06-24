/**
 * Smoke: upload job photo to Supabase Storage + signed URL.
 * Run: npx tsx scripts/smoke-job-photos.ts
 */
import { config } from "dotenv";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const { prisma } = await import("../lib/db/prisma");
const { uploadJobPhoto, getJobPhotosWithUrls } = await import("../server/services/job-photos");
const { MAX_JOB_PHOTOS } = await import("../lib/storage/job-photos");

const TEST_SLUG = "smoke-test-co";

// 1x1 PNG
const PNG_BYTES = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function main() {
  console.log("▶ Job photos smoke test\n");

  const org = await prisma.organization.findFirst({
    where: { businessProfile: { publicSlug: TEST_SLUG } },
  });
  if (!org) {
    console.error("✗ Smoke org not found — run smoke:e2e first");
    process.exit(1);
  }

  const job = await prisma.job.findFirst({
    where: { organizationId: org.id },
    orderBy: { createdAt: "desc" },
  });
  if (!job) {
    console.error("✗ No job found");
    process.exit(1);
  }

  const membership = await prisma.membership.findFirst({
    where: { organizationId: org.id, role: "owner" },
  });
  if (!membership) {
    console.error("✗ Owner membership not found");
    process.exit(1);
  }

  const existing = await prisma.jobPhoto.count({ where: { jobId: job.id } });
  if (existing >= MAX_JOB_PHOTOS) {
    await prisma.jobPhoto.deleteMany({ where: { jobId: job.id } });
    console.log("✓ Cleared existing photos for retest");
  }

  const file = new File([PNG_BYTES], "smoke.png", { type: "image/png" });
  const upload = await uploadJobPhoto(org.id, job.id, membership.id, file, "proof", "smoke test");
  if (!upload.ok) {
    console.error("✗ Upload failed:", upload.error);
    process.exit(1);
  }
  console.log(`✓ Uploaded photo ${upload.photoId}`);

  const photos = await getJobPhotosWithUrls(org.id, job.id);
  if (photos.length === 0 || !photos[0]?.url) {
    console.error("✗ Signed URL missing");
    process.exit(1);
  }
  console.log("✓ Signed URL generated");

  console.log("\n✓ Job photos smoke test passed");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
