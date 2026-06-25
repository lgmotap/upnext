import { config } from "dotenv";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

import { prisma } from "../lib/db/prisma";

async function main() {
  try {
    const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'WaitlistLead'
      ) AS exists
    `;
    console.log("WaitlistLead table exists:", rows[0]?.exists);
    if (rows[0]?.exists) {
      const count = await prisma.waitlistLead.count();
      console.log("WaitlistLead count:", count);
    }
  } catch (e) {
    console.error("ERROR:", e instanceof Error ? e.message : e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
