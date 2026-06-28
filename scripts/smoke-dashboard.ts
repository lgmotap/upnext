/**
 * Smoke: dashboard aggregates load for smoke org.
 * Run: npm run smoke:dashboard
 */
import { config } from "dotenv";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const { prisma } = await import("../lib/db/prisma");
const { getDashboardData } = await import("../server/services/dashboard");
const { getGettingStartedTasks } = await import("../server/services/getting-started");
const { getBookingPageUrl } = await import("../lib/url/app");
const { getDashboardPerformance, defaultDashboardPerformanceRange } = await import(
  "../lib/reporting/dashboard-performance"
);

const TEST_SLUG = "smoke-test-co";

async function main() {
  console.log("▶ Dashboard smoke test\n");

  const org = await prisma.organization.findFirst({
    where: { businessProfile: { publicSlug: TEST_SLUG } },
    include: { businessProfile: { select: { displayName: true, publicSlug: true } } },
  });
  if (!org) {
    console.error("✗ Smoke org not found");
    process.exit(1);
  }

  const slug = org.businessProfile?.publicSlug ?? "";
  const bookingUrl = slug ? getBookingPageUrl(slug) : "";
  const displayName = org.businessProfile?.displayName ?? org.name ?? "Smoke Test Co";
  const gettingStarted = await getGettingStartedTasks(
    org.id,
    bookingUrl || "https://example.com/book",
  );

  const data = await getDashboardData(
    org.id,
    org.timezone,
    org.currency,
    "Smoke Owner",
    displayName,
    gettingStarted.percent,
  );

  if (!Array.isArray(data.queueStats) || data.queueStats.length !== 4) {
    console.error("✗ Expected 4 queue stat cards");
    process.exit(1);
  }

  const ids = data.queueStats.map((s) => s.id).sort();
  const expectedIds = ["awaiting_payment", "jobs_today", "new_bookings", "unassigned_today"];
  if (ids.join(",") !== expectedIds.join(",")) {
    console.error(`✗ Unexpected queue stat ids: ${ids.join(", ")}`);
    process.exit(1);
  }

  for (const stat of data.queueStats) {
    if (!stat.href || !stat.subtext) {
      console.error(`✗ Queue stat ${stat.id} missing href or subtext`);
      process.exit(1);
    }
    if (!Array.isArray(stat.sparkline7d) || stat.sparkline7d.length !== 7) {
      console.error(`✗ Queue stat ${stat.id} missing 7-day sparkline`);
      process.exit(1);
    }
    if (!stat.sparklineColor) {
      console.error(`✗ Queue stat ${stat.id} missing sparkline color`);
      process.exit(1);
    }
  }
  console.log("✓ KPI 7-day sparklines present on all queue stats");

  const newBookings = data.queueStats.find((s) => s.id === "new_bookings");
  if (newBookings?.subtext !== "Today") {
    console.error(`✗ new_bookings subtext should be "Today", got: ${newBookings?.subtext}`);
    process.exit(1);
  }
  const awaitingPayment = data.queueStats.find((s) => s.id === "awaiting_payment");
  if (awaitingPayment?.subtext !== "Awaiting payment") {
    console.error(`✗ awaiting_payment subtext mismatch: ${awaitingPayment?.subtext}`);
    process.exit(1);
  }
  if (awaitingPayment?.value.includes("$")) {
    console.error("✗ awaiting_payment KPI must not include dollar amounts");
    process.exit(1);
  }

  if (newBookings?.href !== "/app/bookings") {
    console.error(`✗ new_bookings href mismatch: ${newBookings?.href}`);
    process.exit(1);
  }
  if (awaitingPayment?.href !== "/app/payments?status=pending") {
    console.error(`✗ awaiting_payment href mismatch: ${awaitingPayment?.href}`);
    process.exit(1);
  }
  console.log("✓ KPI deep links: new bookings + payments pending");

  if (data.pageTitle !== "Dashboard" || data.pageSubtitle !== "Overview of your business operations.") {
    console.error("✗ Missing dashboard page title or subtitle");
    process.exit(1);
  }

  if (gettingStarted.percent >= 100) {
    if (!data.showPerformance) {
      console.error("✗ Expected performance section when getting started is complete");
      process.exit(1);
    }
    const performance = await getDashboardPerformance(
      org.id,
      org.timezone,
      defaultDashboardPerformanceRange(org.timezone),
    );
    console.log(
      `✓ Performance: ${performance.bookings.newCustomers} new customers, ${performance.revenue.totalCents} cents revenue`,
    );
  } else {
    console.log(`✓ Getting started ${gettingStarted.percent}% — performance skipped`);
  }

  console.log(`✓ Queue: ${data.queueStats.map((s) => s.label).join(", ")}`);
  console.log(`✓ Subtitle: ${data.pageSubtitle}`);
  console.log(
    `✓ Upcoming jobs: ${data.upcomingJobs.length}, activity: ${data.activity.length}`,
  );

  const enriched = data.upcomingJobs[0];
  if (enriched) {
    if (!("priceLabel" in enriched) || !("addressLine" in enriched)) {
      console.error("✗ Today job rows missing enriched fields");
      process.exit(1);
    }
    console.log(`✓ Today job sample: ${enriched.customerName} · ${enriched.priceLabel}`);
  }

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
