import { chromium } from "playwright";
import { captureCurrentPage } from "./capture-inline";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { targetDir } from "./paths";
import { slugify } from "./utils";
import type { RegistryPage } from "./types";

function providerPaths(target: string, pageId: string) {
  const dataDir = join(targetDir(target), "data", "provider-portal");
  const shotDir = join(targetDir(target), "screenshots", "provider-portal");
  mkdirSync(dataDir, { recursive: true });
  mkdirSync(shotDir, { recursive: true });
  return {
    jsonPath: join(dataDir, `${pageId}.json`),
    screenshotPath: join(shotDir, `${pageId}.png`),
  };
}

async function snap(
  target: string,
  page: import("playwright").Page,
  id: string,
  label: string,
): Promise<void> {
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
  const dest = providerPaths(target, id);
  const { readFileSync, writeFileSync, copyFileSync } = await import("node:fs");
  writeFileSync(dest.jsonPath, readFileSync(paths.jsonPath, "utf8"), "utf8");
  copyFileSync(paths.screenshotPath, dest.screenshotPath);
  console.log(`  ✓ ${label}`);
}

async function main() {
  const target = "convertlabs";
  const storage = join(targetDir(target), "roles", "provider-portal.storage.json");

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    storageState: storage,
  });
  const page = await ctx.newPage();

  console.log("\n=== Provider — My Jobs with assigned job ===\n");

  await page.goto("https://teams.convertlabs.io/dashboard", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.getByText("My Jobs", { exact: true }).first().click();
  await page.waitForTimeout(2500);

  await snap(target, page, "provider-my-jobs-with-assignment", "My Jobs — assigned job list");

  // Click job row (table row or card containing address/date)
  const clicked = await page.evaluate(() => {
    const row = document.querySelector("table tbody tr");
    if (row) {
      row.click();
      return "table-row";
    }
    const card = [...document.querySelectorAll("div, a, button")].find((el) =>
      (el.textContent ?? "").includes("William St"),
    );
    if (card) {
      card.click();
      return "card";
    }
    return null;
  });

  console.log(`Job click via: ${clicked ?? "none"}`);
  await page.waitForTimeout(3500);

  const urlAfterClick = page.url();
  console.log(`URL after click: ${urlAfterClick}`);

  await snap(target, page, "provider-job-detail-assigned", "Job detail — assigned job");

  // Try double-click and link click if still on list
  await page.getByText("My Jobs", { exact: true }).first().click().catch(() => {});
  await page.waitForTimeout(1500);
  await page.locator("table tbody tr").first().dblclick().catch(() => {});
  await page.waitForTimeout(3000);
  if (page.url() !== urlAfterClick) {
    await snap(target, page, "provider-job-detail-dblclick", "Job detail — after double-click");
  }

  // Click address cell / William St link
  await page.goto("https://teams.convertlabs.io/dashboard", { waitUntil: "networkidle" });
  await page.getByText("My Jobs", { exact: true }).first().click();
  await page.waitForTimeout(1500);
  const addrClick = await page.getByText(/William St/i).first().click().catch(() => false);
  if (addrClick !== false) {
    await page.waitForTimeout(3000);
    await snap(target, page, "provider-job-detail-address-click", "Job detail — address click");
  }

  // Discover all buttons/links on job detail
  const actions = (await page.evaluate(`(() => {
    const norm = (s) => (s || "").replace(/\\s+/g, " ").trim();
    return [...document.querySelectorAll("button, a")]
      .map((el) => norm(el.textContent))
      .filter((t) => t.length > 0 && t.length < 80);
  })()`)) as string[];
  console.log(`Actions visible: ${[...new Set(actions)].join(" | ")}`);

  for (const action of [
    "Clock In",
    "Clock Out",
    "Start Job",
    "Complete",
    "Checklist",
    "Photos",
    "Navigate",
    "Directions",
    "Accept",
    "Decline",
    "View Details",
  ]) {
    const loc = page.getByRole("button", { name: new RegExp(action, "i") }).first();
    if (await loc.isVisible({ timeout: 1000 }).catch(() => false)) {
      await loc.click().catch(() => {});
      await page.waitForTimeout(2000);
      await snap(
        target,
        page,
        `provider-job-action-${slugify(action)}`,
        `Job detail — ${action}`,
      );
      await page.keyboard.press("Escape").catch(() => {});
    }
  }

  // Mobile — fresh session navigation
  await ctx.close();
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    storageState: storage,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });
  const mobile = await mobileCtx.newPage();
  await mobile.goto("https://teams.convertlabs.io/dashboard", { waitUntil: "networkidle" });
  await mobile.locator("text=My Jobs").last().click().catch(() => mobile.getByText("My Jobs").click());
  await mobile.waitForTimeout(2500);
  await snap(target, mobile, "provider-mobile-my-jobs-assigned", "Mobile — My Jobs with assignment");
  await mobile.evaluate(() => document.querySelector("table tbody tr")?.click());
  await mobile.waitForTimeout(3000);
  await snap(target, mobile, "provider-mobile-job-detail", "Mobile — job detail");

  await browser.close();
  console.log("\nDone.");
}

main();
