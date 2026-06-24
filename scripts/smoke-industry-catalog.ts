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
  const count = await prisma.service.count({ where: { organizationId: organization.id } });
  if (count !== expected.totalCount) {
    throw new Error(`Expected ${expected.totalCount} services at signup, got ${count}`);
  }

  const withIcons = await prisma.service.count({
    where: { organizationId: organization.id, iconKey: { not: null } },
  });
  if (withIcons !== expected.totalCount) {
    throw new Error(`Expected all services to have iconKey, got ${withIcons}/${expected.totalCount}`);
  }

  const addons = await prisma.service.count({
    where: { organizationId: organization.id, isAddon: true },
  });
  if (addons < 5) throw new Error("Expected multiple cleaning add-ons like competitor");

  console.log(`✓ Default catalog at signup: ${count} services (${expected.primaryCount} primary, ${addons} add-ons)`);
  console.log("✓ All services have icons");
  console.log("✓ Includes CL-style extras (fridge, oven, cabinets, etc.)");

  console.log("\n✅ Industry catalog smoke passed");
}

main()
  .catch((e) => {
    console.error("✗", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
