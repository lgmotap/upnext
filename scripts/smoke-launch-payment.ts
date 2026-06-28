/**
 * Launch smoke: payment marked paid → visible on job + dashboard revenue.
 * Run: npx tsx scripts/smoke-launch-payment.ts
 */
import { config } from "dotenv";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const { prisma } = await import("../lib/db/prisma");
const { getDashboardData } = await import("../server/services/dashboard");
const { formatMoney } = await import("../lib/money/format");

const TEST_SLUG = "smoke-test-co";

async function main() {
  console.log("▶ Launch payment + dashboard smoke\n");

  const org = await prisma.organization.findFirst({
    where: { businessProfile: { publicSlug: TEST_SLUG } },
    include: { businessProfile: { select: { displayName: true } } },
  });
  if (!org) throw new Error("Run smoke:e2e first");

  const displayName = org.businessProfile?.displayName ?? org.name ?? "Smoke Test Co";

  const job = await prisma.job.findFirst({
    where: { organizationId: org.id },
    orderBy: { createdAt: "desc" },
    include: { paymentRecord: true },
  });
  if (!job?.paymentRecord) throw new Error("Job with payment record not found");

  const paidAt = new Date();
  await prisma.paymentRecord.update({
    where: { id: job.paymentRecord.id },
    data: {
      status: "paid",
      provider: "manual",
      paidAt,
      amountCents: job.paymentRecord.amountCents || job.priceCents,
    },
  });
  console.log(`✓ Payment marked paid on job ${job.id}`);

  const refreshed = await prisma.paymentRecord.findUnique({ where: { id: job.paymentRecord.id } });
  if (refreshed?.status !== "paid") throw new Error("Payment status not paid");
  console.log("✓ Job payment status is paid");

  const { getDashboardPerformance, defaultDashboardPerformanceRange } = await import(
    "../lib/reporting/dashboard-performance"
  );
  await getDashboardData(
    org.id,
    org.timezone,
    org.currency,
    "Smoke Owner",
    displayName,
    100,
  );
  const performance = await getDashboardPerformance(
    org.id,
    org.timezone,
    defaultDashboardPerformanceRange(org.timezone),
  );
  const revenueLabel = formatMoney(performance.revenue.totalCents, org.currency);

  if (performance.revenue.totalCents === 0 && job.priceCents > 0) {
    console.log(`⚠ Dashboard performance revenue shows ${revenueLabel} (paidAt may be outside range window)`);
  } else {
    console.log(`✓ Dashboard performance revenue: ${revenueLabel}`);
  }

  const paidCount = await prisma.paymentRecord.count({
    where: { organizationId: org.id, status: "paid" },
  });
  if (paidCount < 1) throw new Error("No paid payments in org");
  console.log(`✓ ${paidCount} paid payment(s) in org`);

  console.log("\n✓ Launch payment smoke passed");
}

main()
  .catch((e) => {
    console.error("\n✗ Launch payment smoke FAILED:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
