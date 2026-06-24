/**
 * Smoke: industry catalog seeds full service + addon list per vertical.
 * Run: npx tsx scripts/smoke-industry-catalog.ts
 */
import { config } from "dotenv";
import { randomUUID } from "crypto";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const { prisma } = await import("../lib/db/prisma");
const { createWorkspaceForNewUser } = await import("../server/services/onboarding");
const { seedIndustryCatalog } = await import("../server/services/industry-catalog");
const { catalogStats } = await import("../lib/onboarding/industry-catalog");

async function main() {
  console.log("▶ Industry catalog smoke\n");

  const suffix = randomUUID().slice(0, 8);
  const { organization } = await createWorkspaceForNewUser({
    userId: `catalog-smoke-${suffix}`,
    email: `catalog-smoke+${suffix}@upnext.local`,
    name: "Catalog Smoke",
    businessName: `Catalog Smoke ${suffix}`,
  });

  const expected = catalogStats("Residential Cleaning");
  const result = await seedIndustryCatalog(
    organization.id,
    organization.currency,
    "Residential Cleaning",
  );

  if (!result.seeded) throw new Error("Expected catalog to seed on empty org");
  if (result.primaryCount !== expected.primaryCount) {
    throw new Error(`Expected ${expected.primaryCount} primary, got ${result.primaryCount}`);
  }
  if (result.addonCount !== expected.addonCount) {
    throw new Error(`Expected ${expected.addonCount} addons, got ${result.addonCount}`);
  }

  const count = await prisma.service.count({ where: { organizationId: organization.id } });
  if (count !== expected.totalCount) {
    throw new Error(`Expected ${expected.totalCount} services in DB, got ${count}`);
  }

  const addons = await prisma.service.count({
    where: { organizationId: organization.id, isAddon: true },
  });
  if (addons < 5) throw new Error("Expected multiple cleaning add-ons like competitor");

  console.log(`✓ Seeded ${count} services (${result.primaryCount} primary, ${result.addonCount} add-ons)`);
  console.log("✓ Includes CL-style extras (fridge, oven, cabinets, etc.)");

  console.log("\n✅ Industry catalog smoke passed");
}

main()
  .catch((e) => {
    console.error("✗", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
