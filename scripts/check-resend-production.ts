#!/usr/bin/env npx tsx
/**
 * Production gate for Resend — verifies verified domain + EMAIL_FROM + no sandbox redirect.
 * Run against Vercel Production env:
 *   VERCEL_ENV_TARGET=production npm run check:resend:production
 */
import { config } from "dotenv";
import {
  checkResendProductionGate,
  formatProductionGateReport,
} from "../lib/resend/production-gate";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

async function main() {
  const result = await checkResendProductionGate();
  console.log(`\n${formatProductionGateReport(result)}\n`);
  process.exit(result.ok ? 0 : 1);
}

main().catch((err) => {
  console.error("\n✗ Resend production check failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
