#!/usr/bin/env tsx
/** Quick capture: My Jobs + Booking Details drawer only */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import { captureCurrentPage } from "./capture-inline";
import { manifestPath, targetDir } from "./paths";
import { parseArgs, requireArg, slugify } from "./utils";
import type { CaptureManifest, RegistryPage } from "./types";

async function snap(target: string, page: import("playwright").Page, id: string, label: string) {
  const meta: RegistryPage = {
    id,
    phase: "phase-14-provider-app",
    url: page.url(),
    role: "provider",
    source: "portal",
    label,
    waitMs: 2500,
  };
  const paths = await captureCurrentPage(target, page, meta);
  const dataDir = join(targetDir(target), "data", "provider-portal");
  const shotDir = join(targetDir(target), "screenshots", "provider-portal");
  mkdirSync(dataDir, { recursive: true });
  mkdirSync(shotDir, { recursive: true });
  writeFileSync(join(dataDir, `${id}.json`), readFileSync(paths.jsonPath, "utf8"));
  const { copyFileSync } = await import("node:fs");
  copyFileSync(paths.screenshotPath, join(shotDir, `${id}.png`));
  console.log(`  ✓ ${label}`);
}

async function main() {
  const target = requireArg(parseArgs(process.argv.slice(2)), "target");
  const storage = join(targetDir(target), "roles", "provider-portal.storage.json");
  const browser = await chromium.launch({ headless: true });
  const page = await (
    await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: storage })
  ).newPage();

  await page.goto("https://teams.convertlabs.io/dashboard", { waitUntil: "networkidle" });
  await page.getByText("My Jobs", { exact: true }).first().click();
  await page.waitForTimeout(2000);
  await snap(target, page, "provider-my-jobs-with-assignment", "My Jobs — assigned");

  await page.locator("table tbody tr td:last-child .cell").first().click();
  await page.waitForTimeout(3500);
  await snap(target, page, "provider-job-detail-assigned", "Booking Details drawer");

  for (const action of ["Check-In", "On The Way", "Running Late"]) {
    const btn = page.getByRole("button", { name: new RegExp(action.replace("-", "[\\- ]?"), "i") }).first();
    if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
      console.log(`  (found button: ${action})`);
    }
  }

  await browser.close();
  console.log("Done.");
}

main();
