/**
 * Smoke: CSV customer import — create, update, dedupe, row errors.
 * Run: npx tsx scripts/smoke-customer-import.ts
 */
import { config } from "dotenv";
import { randomUUID } from "crypto";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const { prisma } = await import("../lib/db/prisma");
const { createWorkspaceForNewUser } = await import("../server/services/onboarding");
const { parseCsv, rowsToObjects } = await import("../lib/customers/csv");
const { customerImportRowSchema } = await import("../server/validators/customer-import");
const { importCustomerRow } = await import("../server/services/customer-import");
const { findCustomerByEmail } = await import("../server/repositories/customers");

function buildCsv(rows: Record<string, string>[]) {
  const headers = ["firstName", "lastName", "email", "phone", "line1", "city", "region", "postalCode"];
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => `"${row[h] ?? ""}"`).join(","));
  }
  return lines.join("\n");
}

async function importCsvForOrg(organizationId: string, csv: string) {
  const objects = rowsToObjects(parseCsv(csv));
  const summary = { created: 0, updated: 0, skipped: 0 };
  const seen = new Set<string>();

  for (const raw of objects) {
    const emailKey = (raw.email ?? "").trim().toLowerCase();
    if (emailKey && seen.has(emailKey)) {
      summary.skipped += 1;
      continue;
    }
    if (emailKey) seen.add(emailKey);

    const parsed = customerImportRowSchema.safeParse(raw);
    if (!parsed.success) {
      summary.skipped += 1;
      continue;
    }

    const outcome = await importCustomerRow(organizationId, parsed.data);
    if (outcome === "created") summary.created += 1;
    else summary.updated += 1;
  }

  return summary;
}

async function main() {
  console.log("▶ Customer import smoke\n");

  const suffix = randomUUID().slice(0, 8);
  const { organization } = await createWorkspaceForNewUser({
    userId: `import-smoke-${suffix}`,
    email: `import-smoke+${suffix}@upnext.local`,
    name: "Import Smoke",
    businessName: `Import Smoke ${suffix}`,
  });

  const csv = buildCsv([
    {
      firstName: "Alice",
      lastName: "Alpha",
      email: `alice+${suffix}@example.com`,
      phone: "555-1001",
      line1: "1 Alpha St",
      city: "Austin",
      region: "TX",
      postalCode: "78701",
    },
    {
      firstName: "Bob",
      lastName: "Beta",
      email: `bob+${suffix}@example.com`,
      phone: "",
      line1: "2 Beta Ave",
      city: "Austin",
      region: "TX",
      postalCode: "78702",
    },
    {
      firstName: "",
      lastName: "Bad",
      email: `bad+${suffix}@example.com`,
      phone: "",
      line1: "",
      city: "",
      region: "",
      postalCode: "",
    },
    {
      firstName: "Alice",
      lastName: "Dup",
      email: `alice+${suffix}@example.com`,
      phone: "",
      line1: "",
      city: "",
      region: "",
      postalCode: "",
    },
  ]);

  const first = await importCsvForOrg(organization.id, csv);
  if (first.created !== 2) throw new Error(`Expected 2 created, got ${first.created}`);
  if (first.skipped !== 2) throw new Error(`Expected 2 skipped (invalid + duplicate), got ${first.skipped}`);
  console.log(`✓ First import: ${first.created} created, ${first.skipped} skipped`);

  const updateCsv = buildCsv([
    {
      firstName: "Alice",
      lastName: "Alpha-Updated",
      email: `alice+${suffix}@example.com`,
      phone: "555-9999",
      line1: "99 Updated Ln",
      city: "Austin",
      region: "TX",
      postalCode: "78703",
    },
  ]);

  const second = await importCsvForOrg(organization.id, updateCsv);
  if (second.updated !== 1) throw new Error(`Expected 1 updated, got ${second.updated}`);
  console.log("✓ Duplicate email updates existing customer");

  const alice = await findCustomerByEmail(organization.id, `alice+${suffix}@example.com`);
  if (!alice || alice.lastName !== "Alpha-Updated") {
    throw new Error("Customer was not updated");
  }
  if (alice.phone !== "555-9999") throw new Error("Phone was not updated");

  const count = await prisma.customer.count({ where: { organizationId: organization.id } });
  if (count !== 2) throw new Error(`Expected 2 customers total, got ${count}`);

  console.log("\n✅ Customer import smoke passed");
}

main()
  .catch((e) => {
    console.error("✗", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
