/**
 * Smoke: org activity feed loads for smoke org.
 * Run: npm run smoke:activity
 */
import { config } from "dotenv";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const { prisma } = await import("../lib/db/prisma");
const { getOrgActivityFeed } = await import("../server/services/activity-feed");

const TEST_SLUG = "smoke-test-co";

async function main() {
  console.log("▶ Activity feed smoke test\n");

  const org = await prisma.organization.findFirst({
    where: { businessProfile: { publicSlug: TEST_SLUG } },
  });
  if (!org) {
    console.error("✗ Smoke org not found");
    process.exit(1);
  }

  const first = await getOrgActivityFeed(org.id, org.timezone, org.currency, { limit: 10 });
  if (!Array.isArray(first.items)) {
    console.error("✗ Expected activity items array");
    process.exit(1);
  }
  if (first.items.length > 10) {
    console.error("✗ Activity page limit exceeded");
    process.exit(1);
  }

  for (const item of first.items) {
    if (!item.id || !item.title || !item.body || !item.when || !item.type) {
      console.error("✗ Activity item missing required fields", item);
      process.exit(1);
    }
  }
  console.log(`✓ Activity feed: ${first.items.length} items`);

  if (first.items.length > 0 && first.hasMore) {
    const lastAt = first.items[first.items.length - 1]!.at;
    const next = await getOrgActivityFeed(org.id, org.timezone, org.currency, {
      limit: 10,
      before: lastAt,
    });
    if (next.items.some((item) => item.at.getTime() >= lastAt.getTime())) {
      console.error("✗ Pagination before cursor returned overlapping items");
      process.exit(1);
    }
    console.log(`✓ Pagination: ${next.items.length} older items`);
  } else {
    console.log("✓ Pagination skipped (short feed)");
  }

  const full = await getOrgActivityFeed(org.id, org.timezone, org.currency, { limit: 50 });
  if (full.items.length > 50) {
    console.error("✗ Full page limit exceeded");
    process.exit(1);
  }
  console.log(`✓ Full page cap: ${full.items.length} items`);

  console.log("\n✓ Activity feed smoke test passed");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
