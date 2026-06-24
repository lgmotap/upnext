#!/usr/bin/env tsx
/**
 * Headed browser session — log in manually, then save storage state.
 * npm run research:session -- --target convertlabs --role owner
 * npm run research:session -- --target convertlabs --role owner --url https://convertlabs.io/dashboard
 */
import { existsSync, mkdirSync } from "node:fs";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { chromium } from "playwright";
import { ensureTargetDirs, roleStoragePath } from "./paths";
import { loadRegistry, parseArgs, requireArg } from "./utils";
import type { ResearchRole } from "./types";

async function prompt(message: string): Promise<void> {
  const rl = readline.createInterface({ input, output });
  await rl.question(message);
  rl.close();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const target = requireArg(args, "target");
  const role = (typeof args.role === "string" ? args.role : "owner") as ResearchRole;

  const registry = loadRegistry(target);
  const roleDef = registry.roles.find((r) => r.id === role);
  if (!roleDef) {
    throw new Error(
      `Role "${role}" not in registry. Defined: ${registry.roles.map((r) => r.id).join(", ")}`,
    );
  }

  const startUrl =
    typeof args.url === "string"
      ? args.url
      : role === "public"
        ? registry.publicBaseUrl
        : registry.appBaseUrl;

  ensureTargetDirs(target);
  const storagePath = roleStoragePath(target, role);
  mkdirSync(roleStoragePath(target, role).replace(/\/[^/]+$/, ""), {
    recursive: true,
  });

  console.log(`\nConvertLabs research session — role: ${role}`);
  console.log(`Opening: ${startUrl}`);
  console.log(`Storage will save to: ${storagePath}`);
  if (existsSync(storagePath)) {
    console.log(`(Existing storage found — will overwrite after you confirm.)\n`);
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    storageState: existsSync(storagePath) ? storagePath : undefined,
  });
  const page = await context.newPage();
  await page.goto(startUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });

  console.log("\n--- Manual login ---");
  console.log("1. Complete login / MFA in the browser window.");
  console.log("2. Navigate to a page that proves you are authenticated.");
  console.log("3. Return here and press Enter to save session.\n");

  await prompt("Press Enter when ready to save storage state… ");

  await context.storageState({ path: storagePath });
  console.log(`\nSaved: ${storagePath}`);

  await context.close();
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
