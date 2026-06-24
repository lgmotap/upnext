/**
 * Run all launch-checklist smoke scripts in order.
 * Run: npm run smoke:launch
 */
import { spawnSync } from "node:child_process";

const steps = [
  "scripts/smoke-launch-onboarding.ts",
  "scripts/smoke-e2e-booking.ts",
  "scripts/smoke-launch-crew.ts",
  "scripts/smoke-launch-payment.ts",
  "scripts/smoke-stripe-payments.ts",
  "scripts/smoke-global-search.ts",
];

console.log("▶ Launch checklist smoke suite\n");

for (const script of steps) {
  console.log(`── ${script} ──`);
  const result = spawnSync("npx", ["tsx", script], { stdio: "inherit", env: process.env });
  if (result.status !== 0) {
    console.error(`\n✗ Launch suite failed at ${script}`);
    process.exit(result.status ?? 1);
  }
  console.log();
}

console.log("✓ Launch checklist smoke suite passed");
