/**
 * Smoke: dashboard aggregates load for smoke org.
 * Run: npx tsx scripts/smoke-dashboard.ts
 */
import { config } from "dotenv";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const { prisma } = await import("../lib/db/prisma");
const { getDashboardData } = await import("../server/services/dashboard");

const TEST_SLUG = "smoke-test-co";

async function main() {
  console.log("▶ Dashboard smoke test\n");

  const org = await prisma.organization.findFirst({
    where: { businessProfile: { publicSlug: TEST_SLUG } },
  });
  if (!org) {
    console.error("✗ Smoke org not found");
    process.exit(1);
  }

  const data = await getDashboardData(org.id, org.timezone, org.currency, "Smoke Owner");
  if (!Array.isArray(data.stats) || data.stats.length !== 4) {
    console.error("✗ Expected 4 stat cards");
    process.exit(1);
  }
  console.log(`✓ Stats: ${data.stats.map((s) => s.label).join(", ")}`);
  console.log(`✓ Today jobs: ${data.todayJobs.length}, pending: ${data.pendingCount}, activity: ${data.activity.length}`);

  console.log("\n✓ Dashboard smoke test passed");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
