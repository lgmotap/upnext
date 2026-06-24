#!/usr/bin/env tsx
/** Capture confirm-dialog flows + check-out (supplement to main workflow) */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import { captureCurrentPage } from "./capture-inline";
import { targetDir } from "./paths";
import { parseArgs, requireArg, slugify } from "./utils";
import type { RegistryPage } from "./types";

const BASE = "https://teams.convertlabs.io/dashboard";

async function snap(target: string, page: Page, id: string, label: string) {
  const meta: RegistryPage = {
    id,
    phase: "phase-14-provider-workflow",
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
  copyFileSync(paths.screenshotPath, join(shotDir, `${id}.png`));
  console.log(`  ✓ ${label}`);
}

async function openDrawer(page: Page): Promise<boolean> {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.getByText("My Jobs", { exact: true }).first().click();
  await page.waitForTimeout(2000);
  const edit = page.locator("table tbody tr td:last-child .cell").first();
  if (!(await edit.isVisible({ timeout: 5000 }).catch(() => false))) {
    const body = await page.locator("body").innerText();
    console.log("My Jobs body:", body.replace(/\s+/g, " ").slice(0, 500));
    return false;
  }
  await edit.click();
  await page.waitForTimeout(3500);
  return true;
}

async function clickMsgBoxButton(page: Page, text: RegExp): Promise<boolean> {
  const btn = page.locator(".el-message-box__btns button, .el-message-box button").filter({ hasText: text });
  if (await btn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
    await btn.first().click({ force: true });
    await page.waitForTimeout(3000);
    return true;
  }
  return false;
}

async function captureActionWithConfirm(
  target: string,
  page: Page,
  actionLabel: string,
  buttonPattern: RegExp,
): Promise<void> {
  console.log(`\n→ ${actionLabel}`);
  if (!(await openDrawer(page))) return;

  await snap(target, page, `provider-workflow-${slugify(actionLabel)}-before`, `${actionLabel} — before`);

  const btn = page.getByRole("button", { name: buttonPattern }).first();
  if (!(await btn.isVisible({ timeout: 3000 }).catch(() => false))) {
    console.log(`  Button missing: ${actionLabel}`);
    return;
  }
  await btn.click();
  await page.waitForTimeout(2500);

  await snap(target, page, `provider-workflow-${slugify(actionLabel)}-warning`, `${actionLabel} — warning dialog`);

  if (await clickMsgBoxButton(page, /yes,\s*send notification/i)) {
    await snap(target, page, `provider-workflow-${slugify(actionLabel)}-sent`, `${actionLabel} — notification sent`);
  }

  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(1000);
}

async function main() {
  const target = requireArg(parseArgs(process.argv.slice(2)), "target");
  const storage = join(targetDir(target), "roles", "provider-portal.storage.json");
  const browser = await chromium.launch({ headless: true });
  const page = await (
    await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: storage })
  ).newPage();

  // Current job state
  console.log("\n=== Current My Jobs state ===");
  if (await openDrawer(page)) {
    await snap(target, page, "provider-workflow-current-drawer", "Current drawer state");

    const buttons = await page.locator("[role='dialog'] button, .el-dialog button").allTextContents();
    console.log("Drawer buttons:", buttons.filter(Boolean).join(" | "));

    if (await page.getByRole("button", { name: /check-out/i }).isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log("\n→ Check-Out flow");
      await page.getByRole("button", { name: /check-out/i }).click();
      await page.waitForTimeout(3000);
      await snap(target, page, "provider-workflow-check-out-click", "Check-Out — immediate result");

      // Confirm if warning appears
      if (await clickMsgBoxButton(page, /yes|confirm|check.?out/i)) {
        await snap(target, page, "provider-workflow-check-out-confirmed", "Check-Out — confirmed");
      }

      await page.waitForTimeout(2000);
      await page.keyboard.press("Escape").catch(() => {});
    } else if (await page.getByRole("button", { name: /check-in/i }).isVisible({ timeout: 2000 }).catch(() => false)) {
      // Job reset to pre-check-in — capture isolated confirms
      await page.keyboard.press("Escape").catch(() => {});
      await captureActionWithConfirm(target, page, "On The Way (confirmed)", /on the way/i);
      await captureActionWithConfirm(target, page, "Running Late (confirmed)", /running late/i);
    }
  }

  // Final list state
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.getByText("My Jobs", { exact: true }).first().click();
  await page.waitForTimeout(2000);
  await snap(target, page, "provider-workflow-final-my-jobs", "Final My Jobs list state");

  await browser.close();
  console.log("\nDone.");
}

main();
