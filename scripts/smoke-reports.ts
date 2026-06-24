/**
 * Smoke: reporting aggregates for a real org.
 * Run: npx tsx scripts/smoke-reports.ts
 */
import { config } from "dotenv";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const { prisma } = await import("../lib/db/prisma");
const { getReportingData } = await import("../server/services/reporting");

async function main() {
  console.log("▶ Reports smoke\n");

  const org = await prisma.organization.findFirst({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, timezone: true, currency: true },
  });
  if (!org) throw new Error("No organization — run smoke:e2e first");

  const data = await getReportingData(org.id, org.timezone, org.currency);
  if (data.weeklyTrend.length !== 4) throw new Error("Expected 4 weekly trend rows");

  console.log(`✓ Org: ${org.name}`);
  console.log(`✓ All-time revenue: ${data.allTimeRevenueCents} cents`);
  console.log(`✓ This week: ${data.thisWeek.revenueCents} cents, ${data.thisWeek.jobsCompleted} jobs`);
  console.log(`✓ Weekly trend: ${data.weeklyTrend.map((w) => w.revenueCents).join(", ")}`);
  console.log("\n✅ Reports smoke passed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
