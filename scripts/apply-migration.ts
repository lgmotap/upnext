import { config } from "dotenv";
import { readFileSync } from "node:fs";
import pg from "pg";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const file = process.argv[2];
if (!file) {
  console.error("Usage: tsx scripts/apply-migration.ts <migration.sql>");
  process.exit(1);
}

const sql = readFileSync(file, "utf8");
const client = new pg.Client({ connectionString: process.env.DIRECT_URL });
await client.connect();
try {
  await client.query(sql);
  console.log(`✓ Applied ${file}`);
} finally {
  await client.end();
}
