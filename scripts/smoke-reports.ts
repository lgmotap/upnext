/**
 * Smoke: reporting aggregates + date range + CSV export.
 * Run: npx tsx scripts/smoke-reports.ts
 */
import { config } from "dotenv";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const { prisma } = await import("../lib/db/prisma");
const { parseReportDateRange, monthToDateRange } = await import("../lib/reports/range");
const { buildReportsExportCsv } = await import("../lib/reports/csv");
const {
  getReportingData,
  getReportingRangeStats,
  getReportingExportRows,
} = await import("../server/services/reporting");

async function main() {
  console.log("▶ Reports smoke\n");

  const org = await prisma.organization.findFirst({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, timezone: true, currency: true },
  });
  if (!org) throw new Error("No organization — run smoke:e2e first");

  const data = await getReportingData(org.id, org.timezone, org.currency);
  if (data.weeklyTrend.length !== 4) throw new Error("Expected 4 weekly trend rows");

  const defaultRange = monthToDateRange(org.timezone);
  const rangeStats = await getReportingRangeStats(
    org.id,
    org.timezone,
    org.currency,
    defaultRange.start,
    defaultRange.end,
    defaultRange.label,
    defaultRange.fromYmd,
    defaultRange.toYmd,
  );
  if (rangeStats.fromYmd !== defaultRange.fromYmd) {
    throw new Error("Range stats fromYmd mismatch");
  }

  const parsed = parseReportDateRange(defaultRange.fromYmd, defaultRange.toYmd, org.timezone);
  if (!parsed.ok) throw new Error("Expected valid parsed range");

  const invalid = parseReportDateRange(defaultRange.toYmd, defaultRange.fromYmd, org.timezone);
  if (invalid.ok) throw new Error("Expected invalid range when from > to");

  const rows = await getReportingExportRows(
    org.id,
    defaultRange.start,
    defaultRange.end,
    org.timezone,
    org.currency,
  );
  const csv = buildReportsExportCsv(rows);
  if (!csv.startsWith("date,customer,service,job_status,amount,payment_status")) {
    throw new Error("CSV header missing");
  }

  console.log(`✓ Org: ${org.name}`);
  console.log(`✓ All-time revenue: ${data.allTimeRevenueCents} cents`);
  console.log(`✓ This week: ${data.thisWeek.revenueCents} cents, ${data.thisWeek.jobsCompleted} jobs`);
  console.log(`✓ Range (${rangeStats.label}): ${rangeStats.revenueCents} cents revenue`);
  console.log(`✓ Export rows: ${rows.length}, CSV bytes: ${csv.length}`);
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
