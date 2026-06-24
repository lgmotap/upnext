#!/usr/bin/env npx tsx
/**
 * Phase A env check — run after `vercel env pull .env.local`.
 * Loads .env.local the same way prisma.config.ts does.
 */
import { config } from "dotenv";
import { getBackendConfigStatus, isBackendConfigured } from "../lib/env";

// Local overrides only (NEXT_PUBLIC_APP_URL). Secrets come from `vercel env run` parent process.
config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const status = getBackendConfigStatus();
const ok = isBackendConfigured();

console.log("\nUpNext backend env check\n");
for (const [key, state] of Object.entries(status)) {
  const icon = state === "ok" ? "✓" : state === "placeholder" ? "⚠" : "✗";
  console.log(`  ${icon} ${key}: ${state}`);
}
console.log();

if (ok) {
  console.log("✓ Backend is configured — you can run npm run dev and test auth.\n");
  process.exit(0);
}

console.log("✗ Backend not ready. Missing or placeholder values remain.\n");
console.log("Note: `vercel env pull` often leaves sensitive vars empty locally.");
console.log("For local dev, paste secrets directly into .env.local from Supabase dashboard.\n");
console.log("Next steps:");
console.log("  1. Supabase dashboard → Project Settings → API → copy service_role key");
console.log("  2. Supabase dashboard → Connect → ORMs → Prisma → copy pooled + direct URLs");
console.log("  3. Vercel → upnext-saas → Settings → Environment Variables → add all 3 for Development/Preview/Production");
console.log("  4. Run: vercel env pull .env.local");
console.log("  5. Re-run: npm run check:env\n");
process.exit(1);
