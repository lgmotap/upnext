#!/usr/bin/env tsx
/**
 * Deep nested captures — settings sub-tabs, service detail panels, profile menu.
 * npm run research:crawl-deep -- --target convertlabs
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import { captureCurrentPage } from "./capture-inline";
import { roleStoragePath, manifestPath, targetDir } from "./paths";
import { parseArgs, requireArg, slugify } from "./utils";
import type { CaptureManifest, RegistryPage } from "./types";

async function safeClick(page: import("playwright").Page, label: string): Promise<boolean> {
  const locators = [
    page.getByRole("tab", { name: label, exact: true }),
    page.getByRole("button", { name: label, exact: true }),
    page.getByRole("link", { name: label, exact: true }),
    page.getByRole("menuitem", { name: label, exact: true }),
    page.getByText(label, { exact: true }).first(),
  ];
  for (const loc of locators) {
    try {
      if (await loc.isVisible({ timeout: 2000 })) {
        await loc.click({ timeout: 5000 });
        await page.waitForTimeout(2000);
        return true;
      }
    } catch {
      // continue
    }
  }
  return false;
}

async function capture(
  target: string,
  page: import("playwright").Page,
  manifestById: Map<string, CaptureManifest["pages"][0]>,
  meta: RegistryPage,
): Promise<void> {
  const paths = await captureCurrentPage(target, page, meta);
  manifestById.set(meta.id, {
    pageId: meta.id,
    phase: meta.phase,
    role: meta.role,
    url: meta.url,
    capturedAt: new Date().toISOString(),
    jsonPath: paths.jsonPath,
    screenshotPath: paths.screenshotPath,
    status: "ok",
  });
  console.log(`  ✓ ${meta.label}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const target = requireArg(args, "target");
  const storagePath = roleStoragePath(target, "owner");
  if (!existsSync(storagePath)) {
    throw new Error("No session — run research:login first");
  }

  const manifest: CaptureManifest = existsSync(manifestPath(target))
    ? (JSON.parse(readFileSync(manifestPath(target), "utf8")) as CaptureManifest)
    : { target, generatedAt: new Date().toISOString(), pages: [] };
  const manifestById = new Map(manifest.pages.map((p) => [p.pageId, p]));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    storageState: storagePath,
  });
  const page = await context.newPage();

  // ── Settings: all 7 tabs + notification audiences ─────────────────
  console.log("\n=== Settings deep ===");
  await page.goto("https://convertlabs.io/booking/settings", {
    waitUntil: "networkidle",
    timeout: 60_000,
  });
  await page.waitForTimeout(2000);

  const settingsTabs = [
    "Services",
    "Payment",
    "Time & Scheduling",
    "Portals",
    "Notifications",
    "Forms",
    "Integrations",
  ];

  for (const tab of settingsTabs) {
    console.log(`→ Settings / ${tab}`);
    await page.goto("https://convertlabs.io/booking/settings", {
      waitUntil: "networkidle",
      timeout: 60_000,
    });
    await page.waitForTimeout(1500);
    if (!(await safeClick(page, tab))) {
      console.log(`  skip tab`);
      continue;
    }

    await capture(target, page, manifestById, {
      id: `app-deep-settings-${slugify(tab)}`,
      phase: "phase-15-settings",
      url: page.url(),
      role: "owner",
      source: "app",
      label: `Settings — ${tab} (deep)`,
      waitMs: 2500,
    });

    if (tab === "Notifications") {
      for (const audience of ["Company", "Customers", "Service Providers", "Admins"]) {
        if (await safeClick(page, audience)) {
          await capture(target, page, manifestById, {
            id: `app-deep-notifications-${slugify(audience)}`,
            phase: "phase-15-settings",
            url: page.url(),
            role: "owner",
            source: "app",
            label: `Notifications — ${audience}`,
            waitMs: 2000,
          });
        }
      }
    }
  }

  // ── Service detail: Pricing Parameters, Extras, Frequencies ─────────
  console.log("\n=== Service detail panels ===");
  await page.goto("https://convertlabs.io/booking/settings", {
    waitUntil: "networkidle",
    timeout: 60_000,
  });
  await safeClick(page, "Services");
  await page.waitForTimeout(2000);

  if (await safeClick(page, "Studio")) {
    await capture(target, page, manifestById, {
      id: "app-deep-service-studio",
      phase: "phase-06-services",
      url: page.url(),
      role: "owner",
      source: "app",
      label: "Service — Studio detail",
      waitMs: 2000,
    });

    for (const panel of ["Pricing Parameters", "Extras", "Frequencies"]) {
      if (await safeClick(page, panel)) {
        await capture(target, page, manifestById, {
          id: `app-deep-service-studio-${slugify(panel)}`,
          phase: "phase-06-services",
          url: page.url(),
          role: "owner",
          source: "app",
          label: `Service Studio — ${panel}`,
          waitMs: 2000,
        });
      }
    }
  }

  // ── User profile dropdown (top-right) ───────────────────────────────
  console.log("\n=== Profile menu ===");
  await page.goto("https://convertlabs.io/dashboard", {
    waitUntil: "networkidle",
    timeout: 60_000,
  });
  await page.waitForTimeout(2000);

  const profileTriggers = [
    page.locator("header").getByText("Luis Pimentel").last(),
    page.locator('[class*="avatar"]').last(),
    page.locator("header button").last(),
  ];

  for (const trigger of profileTriggers) {
    try {
      if (await trigger.isVisible({ timeout: 2000 })) {
        await trigger.click();
        await page.waitForTimeout(1500);
        break;
      }
    } catch {
      // next
    }
  }

  await capture(target, page, manifestById, {
    id: "app-deep-profile-menu",
    phase: "phase-04-owner-nav",
    url: page.url(),
    role: "owner",
    source: "app",
    label: "Profile menu open",
    waitMs: 1000,
  });

  const profileItems = (await page.evaluate(`(() => {
    const norm = (s) => (s || "").replace(/\\s+/g, " ").trim();
    const items = [];
    const seen = new Set();
    document.querySelectorAll("[role='menuitem'], [role='menu'] *").forEach((el) => {
      const text = norm(el.textContent);
      if (text && text.length < 60 && !seen.has(text)) {
        seen.add(text);
        items.push(text);
      }
    });
    return items;
  })()`)) as string[];

  for (const item of profileItems) {
    if (/log\s*out|sign\s*out/i.test(item)) continue;
    await page.goto("https://convertlabs.io/dashboard", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    for (const trigger of profileTriggers) {
      try {
        if (await trigger.isVisible({ timeout: 1500 })) {
          await trigger.click();
          await page.waitForTimeout(1000);
          break;
        }
      } catch {
        // continue
      }
    }
    if (await safeClick(page, item)) {
      await capture(target, page, manifestById, {
        id: `app-deep-profile-${slugify(item)}`,
        phase: "phase-04-owner-nav",
        url: page.url(),
        role: "owner",
        source: "app",
        label: `Profile → ${item}`,
        waitMs: 2000,
      });
    }
  }

  // ── Marketing sub-pages ─────────────────────────────────────────────
  console.log("\n=== Marketing deep ===");
  const marketingRoutes = [
    { url: "https://convertlabs.io/marketing/leads/list/2753", label: "Leads list" },
    { url: "https://convertlabs.io/marketing/widgets/new", label: "New widget" },
    { url: "https://convertlabs.io/marketing/campaigns/new", label: "New campaign" },
  ];

  for (const route of marketingRoutes) {
    try {
      await page.goto(route.url, { waitUntil: "networkidle", timeout: 45_000 });
      await page.waitForTimeout(2500);
      await capture(target, page, manifestById, {
        id: `app-deep-${slugify(route.label)}`,
        phase: "phase-10-notifications",
        url: page.url(),
        role: "owner",
        source: "app",
        label: route.label,
        waitMs: 2000,
      });
    } catch (err) {
      console.log(`  skip ${route.label}: ${String(err)}`);
    }
  }

  // ── Modals: New Service, New Provider ───────────────────────────────
  console.log("\n=== Remaining modals ===");
  const modalChecks = [
    { url: "https://convertlabs.io/booking/settings", tab: "Services", btn: "New Service" },
    {
      url: "https://convertlabs.io/booking/service-providers",
      tab: null,
      btn: "New Provider",
    },
    { url: "https://convertlabs.io/booking/discounts", tab: null, btn: "New Discount" },
    { url: "https://convertlabs.io/booking/invoices", tab: null, btn: "New Invoice" },
  ];

  for (const check of modalChecks) {
    await page.goto(check.url, { waitUntil: "networkidle", timeout: 45_000 });
    await page.waitForTimeout(2000);
    if (check.tab) await safeClick(page, check.tab);
    if (await safeClick(page, check.btn)) {
      await capture(target, page, manifestById, {
        id: `app-deep-modal-${slugify(check.btn)}`,
        phase: "phase-05-bookings",
        url: page.url(),
        role: "owner",
        source: "app",
        label: `Modal — ${check.btn}`,
        waitMs: 2000,
      });
      await page.keyboard.press("Escape");
    }
  }

  await context.close();
  await browser.close();

  manifest.generatedAt = new Date().toISOString();
  manifest.pages = Array.from(manifestById.values()).sort((a, b) =>
    a.pageId.localeCompare(b.pageId),
  );
  writeFileSync(manifestPath(target), JSON.stringify(manifest, null, 2), "utf8");

  const deepCount = manifest.pages.filter((p) => p.pageId.startsWith("app-deep")).length;
  console.log(`\nDone. Deep captures: ${deepCount}, total: ${manifest.pages.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
