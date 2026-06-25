/**
 * Smoke: CRM list UX + customer detail depth.
 * Run: npm run smoke:crm-lists
 */
import { config } from "dotenv";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const { prisma } = await import("../lib/db/prisma");
const {
  countCustomersForOrg,
  getLastJobAtByCustomerIds,
  listCustomersForOrg,
  listCustomerTagsForOrg,
  updateCustomerTags,
} = await import("../server/repositories/customers");
const { listPaymentRecordsForCustomer } = await import("../server/repositories/payments");
const { DEFAULT_LIST_PAGE_SIZE } = await import("../lib/pagination");

const TEST_SLUG = "smoke-test-co";

async function main() {
  console.log("▶ CRM lists smoke\n");

  const org = await prisma.organization.findFirst({
    where: { businessProfile: { publicSlug: TEST_SLUG } },
    select: { id: true },
  });
  if (!org) throw new Error("Run smoke:e2e first — missing smoke-test-co org");

  const total = await countCustomersForOrg(org.id);
  if (total === 0) throw new Error("No customers in smoke org");

  const page1 = await listCustomersForOrg(org.id, { page: 1, pageSize: DEFAULT_LIST_PAGE_SIZE });
  if (page1.length === 0) throw new Error("Page 1 empty");
  console.log(`✓ ${total} customers, page 1 has ${page1.length}`);

  const sample = page1[0]!;
  await updateCustomerTags(org.id, sample.id, ["smoke-tag"]);
  const tagged = await countCustomersForOrg(org.id, undefined, "smoke-tag");
  if (tagged < 1) throw new Error("Tag filter returned no customers");
  console.log(`✓ Tag filter: ${tagged} with smoke-tag`);

  const tags = await listCustomerTagsForOrg(org.id);
  if (!tags.includes("smoke-tag")) throw new Error("smoke-tag not in org tag list");

  const payments = await listPaymentRecordsForCustomer(org.id, sample.id);
  console.log(`✓ Customer payments query: ${payments.length} rows`);

  const lastJobMap = await getLastJobAtByCustomerIds(
    org.id,
    page1.map((c) => c.id),
  );
  const withJob = page1.filter((c) => lastJobMap[c.id]);
  console.log(`✓ Last job dates for ${withJob.length}/${page1.length} customers on page`);

  const pending = await prisma.bookingRequest.count({
    where: { organizationId: org.id, status: "pending" },
  });
  const history = await prisma.bookingRequest.count({
    where: { organizationId: org.id, status: { not: "pending" } },
  });
  console.log(`✓ Bookings split: ${pending} pending, ${history} history`);

  const { countBookingRequestsForOrg, listBookingRequestsForOrg } = await import(
    "../server/repositories/bookings"
  );
  const historyFiltered = await countBookingRequestsForOrg(org.id, { status: "history" });
  const historyPage = await listBookingRequestsForOrg(org.id, {
    status: "history",
    page: 1,
    pageSize: 10,
  });
  if (historyFiltered > 0 && historyPage.length === 0) {
    throw new Error("History page empty but count > 0");
  }
  console.log(`✓ Bookings history query: ${historyFiltered} total, page 1 has ${historyPage.length}`);

  const accepted30d = await countBookingRequestsForOrg(org.id, {
    status: "accepted",
    range: "30d",
  });
  console.log(`✓ Accepted (30d filter): ${accepted30d}`);

  const logs = await prisma.notificationLog.count({ where: { organizationId: org.id } });
  console.log(`✓ ${logs} notification log entries`);

  console.log("\n✅ CRM lists smoke passed");
}

main()
  .catch((e) => {
    console.error("✗", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
