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
  const expectedIds = [
    "awaiting_payment",
    "booked_today",
    "scheduled_today",
    "unassigned_today",
  ];
  if (ids.join(",") !== expectedIds.join(",")) {
    console.error(`✗ Unexpected queue stat ids: ${ids.join(", ")}`);
    process.exit(1);
  }

  for (const stat of data.queueStats) {
    if (!stat.href || !stat.iconClassName) {
      console.error(`✗ Queue stat ${stat.id} missing href or iconClassName`);
      process.exit(1);
    }
  }

  if (!data.greetingTitle || !data.greetingSubtitle) {
    console.error("✗ Missing greeting title or subtitle");
    process.exit(1);
  }
  if (!data.greetingTitle.includes(displayName)) {
    console.error(`✗ Greeting title should reference business name: ${data.greetingTitle}`);
    process.exit(1);
  }

  if (gettingStarted.percent >= 100) {
    if (!data.showBusinessSnapshot || !data.snapshot) {
      console.error("✗ Expected business snapshot when getting started is complete");
      process.exit(1);
    }
    console.log(
      `✓ Snapshot: ${data.snapshot.bookingsCreatedCount} bookings, ${data.snapshot.jobsScheduledCount} jobs`,
    );
  } else {
    console.log(`✓ Getting started ${gettingStarted.percent}% — snapshot skipped`);
  }

  console.log(`✓ Queue: ${data.queueStats.map((s) => s.label).join(", ")}`);
  console.log(`✓ Greeting: ${data.greetingTitle}`);
  console.log(
    `✓ Today jobs: ${data.todayJobs.length}, pending: ${data.pendingCount}, activity: ${data.activity.length}`,
  );

  const enriched = data.todayJobs[0];
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
