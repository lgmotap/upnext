#!/usr/bin/env tsx
/**
 * Crawl ConvertLabs customer portal + capture owner Settings → Portals config.
 * npm run research:crawl-customer-portal -- --target convertlabs
 *
 * Credentials: targets/<target>/.customer-portal.local.json (gitignored)
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import { captureCurrentPage } from "./capture-inline";
import { roleStoragePath, targetDir } from "./paths";
import { parseArgs, requireArg, slugify, sleep } from "./utils";
import type { RegistryPage } from "./types";

interface CustomerPortalConfig {
  baseUrl: string;
  username: string;
  password: string;
}

function loadConfig(target: string): CustomerPortalConfig {
  const path = join(targetDir(target), ".customer-portal.local.json");
  if (!existsSync(path)) {
    throw new Error(`Missing ${path}`);
  }
  return JSON.parse(readFileSync(path, "utf8")) as CustomerPortalConfig;
}

function dirs(target: string) {
  const dataDir = join(targetDir(target), "data", "customer-portal");
  const shotDir = join(targetDir(target), "screenshots", "customer-portal");
  const reportDir = join(targetDir(target), "reports");
  mkdirSync(dataDir, { recursive: true });
  mkdirSync(shotDir, { recursive: true });
  mkdirSync(reportDir, { recursive: true });
  return { dataDir, shotDir, reportDir };
}

async function snap(target: string, page: Page, id: string, label: string, waitMs = 3000) {
  const meta: RegistryPage = {
    id,
    phase: "phase-13-customer-portal",
    url: page.url(),
    role: "customer-portal",
    source: "portal",
    label,
    waitMs,
  };
  const paths = await captureCurrentPage(target, page, meta);
  const { dataDir, shotDir } = dirs(target);
  writeFileSync(join(dataDir, `${id}.json`), readFileSync(paths.jsonPath, "utf8"));
  copyFileSync(paths.screenshotPath, join(shotDir, `${id}.png`));
  console.log(`  ✓ ${label} → ${page.url()}`);
}

async function safeClick(page: Page, pattern: RegExp | string): Promise<boolean> {
  const pat = typeof pattern === "string" ? new RegExp(pattern, "i") : pattern;
  for (const loc of [
    page.getByRole("link", { name: pat }).first(),
    page.getByRole("button", { name: pat }).first(),
    page.getByRole("tab", { name: pat }).first(),
    page.getByText(pat).first(),
  ]) {
    if (await loc.isVisible({ timeout: 2000 }).catch(() => false)) {
      await loc.click().catch(() => {});
      await page.waitForTimeout(2500);
      return true;
    }
  }
  return false;
}

async function discoverNav(page: Page): Promise<string[]> {
  return (await page.evaluate(`(() => {
    const norm = (s) => (s || "").replace(/\\s+/g, " ").trim();
    const seen = new Set();
    const items = [];
    for (const sel of ["nav a", "nav button", "aside a", "[role='tab']", "header a", "header button", ".menu a"]) {
      document.querySelectorAll(sel).forEach((el) => {
        const t = norm(el.textContent || el.getAttribute("aria-label") || "");
        if (t && t.length < 60 && !seen.has(t)) { seen.add(t); items.push(t); }
      });
    }
    return items;
  })()`)) as string[];
}

async function loginCustomerPortal(target: string, page: Page, cfg: CustomerPortalConfig): Promise<void> {
  await page.goto(cfg.baseUrl, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.waitForTimeout(4000);
  await snap("convertlabs", page, "customer-portal-login-landing", "Customer portal — login landing");

  const email = page.locator("input[type='email'], input[name*='email' i], input[name*='user' i], #email, #username").first();
  const password = page.locator("input[type='password'], #password").first();

  if (await email.isVisible({ timeout: 5000 }).catch(() => false)) {
    await email.fill(cfg.username);
    await password.fill(cfg.password);
    const submit = page.getByRole("button", { name: /sign in|log in|login|continue/i }).first();
    if (await submit.isVisible({ timeout: 2000 }).catch(() => false)) {
      await submit.click();
    } else {
      await page.keyboard.press("Enter");
    }
    await page.waitForTimeout(5000);
  }
}

async function captureOwnerPortalsSettings(target: string): Promise<void> {
  const storage = roleStoragePath(target, "owner");
  if (!existsSync(storage)) {
    console.log("  (skip owner portals settings — no owner session)");
    return;
  }
  console.log("\n=== Owner app — Settings → Portals ===");
  const browser = await chromium.launch({ headless: true });
  const page = await (
    await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: storage })
  ).newPage();
  await page.goto("https://convertlabs.io/booking/settings", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.getByRole("tab", { name: "Portals" }).click().catch(() => page.getByText("Portals", { exact: true }).click());
  await page.waitForTimeout(2500);
  await snap(target, page, "owner-settings-portals-customer", "Owner — Settings Portals (customer config)");
  await browser.close();
}

async function main() {
  const target = requireArg(parseArgs(process.argv.slice(2)), "target");
  const cfg = loadConfig(target);
  const storagePath = join(targetDir(target), "roles", "customer-portal.storage.json");
  mkdirSync(join(targetDir(target), "roles"), { recursive: true });

  await captureOwnerPortalsSettings(target);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    storageState: existsSync(storagePath) ? storagePath : undefined,
  });
  let page = await context.newPage();

  console.log("\n=== Customer portal — login ===");
  await loginCustomerPortal(target, page, cfg);
  await context.storageState({ path: storagePath });

  const afterLogin = page.url();
  await snap(target, page, "customer-portal-dashboard", "Customer portal — after login");

  const navItems = await discoverNav(page);
  console.log(`Nav: ${navItems.join(" | ") || "(none)"}`);

  // Click all nav items
  console.log("\n=== Customer portal — navigation ===");
  for (const item of navItems.slice(0, 20)) {
    if (/log\s*out|sign\s*out/i.test(item)) continue;
    await page.goto(afterLogin.includes(cfg.baseUrl) ? afterLogin : cfg.baseUrl, { waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForTimeout(2000);
    if (await safeClick(page, item)) {
      await snap(target, page, `customer-portal-nav-${slugify(item)}`, `Customer portal — ${item}`);
    }
  }

  // Known customer portal sections (from help + typical patterns)
  const knownSections = [
    "Dashboard",
    "Home",
    "Bookings",
    "Upcoming",
    "Past",
    "History",
    "Schedule",
    "Appointments",
    "Invoices",
    "Payments",
    "Payment Methods",
    "Cards",
    "Profile",
    "Account",
    "Settings",
    "Refer",
    "Referral",
    "Refer a friend",
    "Gift Cards",
    "Quotes",
    "Book Now",
    "Rebook",
    "Addresses",
  ];

  console.log("\n=== Customer portal — known sections ===");
  for (const section of knownSections) {
    await page.goto(cfg.baseUrl, { waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForTimeout(1500);
    if (await safeClick(page, section)) {
      await snap(target, page, `customer-portal-section-${slugify(section)}`, `Customer portal — section: ${section}`);
    }
  }

  // Booking / job row click
  console.log("\n=== Customer portal — booking detail ===");
  await page.goto(cfg.baseUrl, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  const rowClicked = await page.evaluate(`(() => {
    const row = document.querySelector("table tbody tr, [class*='booking'], [class*='appointment'], [class*='card']");
    if (row) { row.click(); return true; }
    return false;
  })()`);
  if (rowClicked) {
    await page.waitForTimeout(3000);
    await snap(target, page, "customer-portal-booking-detail", "Customer portal — booking detail");
    for (const action of ["Reschedule", "Cancel", "Rebook", "Pay", "View", "Details"]) {
      if (await safeClick(page, action)) {
        await snap(target, page, `customer-portal-action-${slugify(action)}`, `Customer portal — ${action}`);
        await page.keyboard.press("Escape").catch(() => {});
      }
    }
  }

  // Mobile pass
  console.log("\n=== Customer portal — mobile ===");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(cfg.baseUrl, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  await snap(target, page, "customer-portal-mobile-dashboard", "Customer portal — mobile dashboard");

  await browser.close();

  // Report stub
  const { reportDir } = dirs(target);
  writeFileSync(
    join(reportDir, "customer-portal.md"),
    [
      "# Customer portal",
      "",
      `**URL:** ${cfg.baseUrl}`,
      "",
      "## Where it's configured (owner app)",
      "",
      "Settings → **Portals** tab (`/booking/settings`, Portals tab)",
      "",
      "- **Enable Customer Portal** toggle",
      "- **Subdomain slug** field — pattern: `{slug}-customer.convertlabs.io`",
      "- Example: `freshhome` → `https://freshhome-customer.convertlabs.io`",
      "",
      "Capture: `owner-settings-portals-customer` in `screenshots/customer-portal/`",
      "",
      "## Portal captures",
      "",
      "See `screenshots/customer-portal/` and `data/customer-portal/`",
      "",
      `Generated: ${new Date().toISOString()}`,
    ].join("\n"),
    "utf8",
  );

  console.log(`\n=== Done ===\nReport: ${join(reportDir, "customer-portal.md")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
