/**
 * Smoke: global search across customers, jobs, bookings.
 * Run: npx tsx scripts/smoke-global-search.ts
 */
import { config } from "dotenv";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const { prisma } = await import("../lib/db/prisma");
const { globalSearch } = await import("../server/services/global-search");

async function main() {
  console.log("▶ Global search smoke\n");

  const org = await prisma.organization.findFirst({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });
  if (!org) throw new Error("No organization");

  const customer = await prisma.customer.findFirst({
    where: { organizationId: org.id },
    select: { firstName: true, email: true },
  });
  if (!customer) throw new Error("No customer — run smoke:e2e first");

  const byName = await globalSearch(org.id, customer.firstName.slice(0, 3));
  if (byName.length === 0) throw new Error("Search by name returned no results");

  const byEmail = await globalSearch(org.id, customer.email.split("@")[0]);
  if (!byEmail.some((r) => r.type === "customer")) {
    throw new Error("Search by email prefix missing customer");
  }

  const short = await globalSearch(org.id, "a");
  if (short.length !== 0) throw new Error("Single-char query should return empty");

  console.log(`✓ Org: ${org.name}`);
  console.log(`✓ Name search: ${byName.length} results`);
  console.log(`✓ Email search: ${byEmail.length} results`);
  console.log("\n✅ Global search smoke passed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
