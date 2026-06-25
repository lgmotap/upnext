import { config } from "dotenv";
import { prisma } from "../lib/db/prisma";

config({ path: ".env", override: false });

async function main() {
  const rows = await prisma.$queryRaw<
    {
      migration_name: string;
      finished_at: Date | null;
      rolled_back_at: Date | null;
      started_at: Date;
      logs: string | null;
    }[]
  >`SELECT migration_name, finished_at, rolled_back_at, started_at, LEFT(logs, 300) as logs FROM _prisma_migrations ORDER BY migration_name`;

  console.log("All migrations:");
  for (const row of rows) {
    const status = row.finished_at
      ? "applied"
      : row.rolled_back_at
        ? "rolled_back"
        : "FAILED/PENDING";
    console.log(`  ${status} ${row.migration_name}`);
  }

  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
  `;
  console.log(`\nPublic tables: ${tables.length}`);
  console.log(tables.map((t) => t.tablename).slice(0, 20).join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
