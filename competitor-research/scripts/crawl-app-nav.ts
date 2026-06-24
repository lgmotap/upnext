#!/usr/bin/env tsx
/**
 * Capture every main app section by clicking sidebar nav (SPA-safe).
 * npm run research:crawl-app -- --target convertlabs
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { captureCurrentPage } from "./capture-inline";
import { capturePage } from "./capture-page-lib";
import { loginAndSaveSession } from "./login-app";
import { manifestPath, roleStoragePath } from "./paths";
import { loadRegistry, parseArgs, requireArg, slugify, sleep } from "./utils";
import type { CaptureManifest, RegistryPage } from "./types";

const APP_SECTIONS = [
  "Getting Started",
  "Dashboard",
  "Bookings",
  "Calendar",
  "Customers",
  "Service Providers",
  "Providers Activity",
  "Payouts",
  "Quotes",
  "Invoices",
  "Discounts",
  "Marketing",
  "Websites",
  "Domains",
  "Settings",
];

const SETTINGS_TABS_FALLBACK = [
  "General",
  "Business",
  "Booking",
  "Services",
  "Notifications",
  "Payments",
  "Portals",
  "Team",
  "Integrations",
  "Billing",
  "Branding",
];

const EXTRA_APP_ROUTES: Array<{
  id: string;
  url: string;
  label: string;
  phase: string;
}> = [
  {
    id: "app-bookings-new",
    url: "https://convertlabs.io/booking/bookings/new-booking",
    label: "New Booking form",
    phase: "phase-05-bookings",
  },
  {
    id: "app-customers-new",
    url: "https://convertlabs.io/booking/customer/new",
    label: "New Customer form",
    phase: "phase-07-customers",
  },
];

async function ensureSession(target: string, forceLogin: boolean): Promise<string> {
  const storagePath = roleStoragePath(target, "owner");
  if (forceLogin || !existsSync(storagePath)) {
    const result = await loginAndSaveSession({ target });
    return result.storagePath;
  }
  return storagePath;
}

async function clickNavItem(
  page: import("playwright").Page,
  label: string,
): Promise<boolean> {
  const attempts = [
    page.getByRole("link", { name: label, exact: true }),
    page.getByRole("button", { name: label, exact: true }),
    page.locator(`nav >> text="${label}"`).first(),
    page.locator(`aside >> text="${label}"`).first(),
    page.getByText(label, { exact: true }).first(),
  ];

  for (const loc of attempts) {
    try {
      if (await loc.isVisible({ timeout: 2000 })) {
        await loc.click({ timeout: 5000 });
        await page.waitForTimeout(2500);
        return true;
      }
    } catch {
      // try next
    }
  }
  return false;
}

async function discoverSettingsTabs(page: import("playwright").Page): Promise<string[]> {
  const tabs = (await page.evaluate(`(() => {
    const norm = (s) => (s || "").replace(/\\s+/g, " ").trim();
    const results = [];
    const seen = new Set();
    document.querySelectorAll("[role='tab']").forEach((el) => {
      const text = norm(el.textContent);
      if (text && text.length < 50 && !seen.has(text)) {
        seen.add(text);
        results.push(text);
      }
    });
    return results;
  })()`)) as string[];
  return tabs.length > 0 ? tabs : SETTINGS_TABS_FALLBACK;
}

async function clickSettingsTab(
  page: import("playwright").Page,
  tab: string,
): Promise<boolean> {
  const attempts = [
    page.getByRole("tab", { name: tab }),
    page.locator(`[role='tablist'] >> text="${tab}"`).first(),
    page.getByText(tab, { exact: true }).first(),
  ];
  for (const loc of attempts) {
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

function recordManifest(
  manifestById: Map<string, CaptureManifest["pages"][0]>,
  meta: RegistryPage,
  status: "ok" | "error",
  paths?: { jsonPath: string; screenshotPath: string },
  error?: string,
) {
  manifestById.set(meta.id, {
    pageId: meta.id,
    phase: meta.phase,
    role: meta.role,
    url: meta.url,
    capturedAt: new Date().toISOString(),
    jsonPath: paths?.jsonPath ?? "",
    screenshotPath: paths?.screenshotPath ?? "",
    status,
    error,
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const target = requireArg(args, "target");
  const force = Boolean(args.force);
  const forceLogin = Boolean(args.login);
  const registry = loadRegistry(target);

  const storagePath = await ensureSession(target, forceLogin);
  const appUrl = registry.appLoginUrl ?? "https://convertlabs.io/get-started";

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

  await page.goto(appUrl, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(3000);

  let inlineCount = 0;

  for (const section of APP_SECTIONS) {
    console.log(`Nav → ${section}`);
    const clicked = await clickNavItem(page, section);
    if (!clicked) {
      console.log(`  WARN: could not click "${section}"`);
      continue;
    }

    const meta: RegistryPage = {
      id: `app-${slugify(section)}`,
      phase: section === "Settings" ? "phase-15-settings" : "phase-04-owner-nav",
      url: page.url(),
      role: "owner",
      source: "app",
      label: section,
      waitMs: 2000,
    };

    if (!force && existsSync(manifestById.get(meta.id)?.jsonPath ?? "")) {
      console.log(`  skip ${meta.id} (exists, use --force)`);
    } else {
      const paths = await captureCurrentPage(target, page, meta);
      recordManifest(manifestById, meta, "ok", paths);
      inlineCount++;
      console.log(`  captured ${meta.id}`);
    }

    if (section === "Settings") {
      const tabs = await discoverSettingsTabs(page);
      console.log(`  Settings tabs found: ${tabs.join(", ")}`);

      for (const tab of tabs) {
        console.log(`  Settings tab → ${tab}`);
        const tabClicked = await clickSettingsTab(page, tab);
        if (!tabClicked) {
          console.log(`    WARN: tab not found "${tab}"`);
          continue;
        }

        const tabMeta: RegistryPage = {
          id: `app-settings-${slugify(tab)}`,
          phase: "phase-15-settings",
          url: page.url(),
          role: "owner",
          source: "app",
          label: `Settings — ${tab}`,
          waitMs: 2000,
        };

        const paths = await captureCurrentPage(target, page, tabMeta);
        recordManifest(manifestById, tabMeta, "ok", paths);
        inlineCount++;
        console.log(`    captured ${tabMeta.id}`);
      }
    }
  }

  await context.close();
  await browser.close();

  console.log(`\nCapturing ${EXTRA_APP_ROUTES.length} extra app routes…`);
  for (const route of EXTRA_APP_ROUTES) {
    const meta: RegistryPage = {
      id: route.id,
      phase: route.phase,
      url: route.url,
      role: "owner",
      source: "app",
      label: route.label,
      waitMs: 3000,
    };
    console.log(`  ${route.label}`);
    const result = await capturePage({ target, page: meta, headless: true, force });
    recordManifest(
      manifestById,
      meta,
      result.status === "ok" ? "ok" : "error",
      result.jsonPath && result.screenshotPath
        ? { jsonPath: result.jsonPath, screenshotPath: result.screenshotPath }
        : undefined,
      result.error,
    );
    await sleep(registry.crawlDelayMs);
  }

  manifest.generatedAt = new Date().toISOString();
  manifest.pages = Array.from(manifestById.values()).sort((a, b) =>
    a.pageId.localeCompare(b.pageId),
  );
  writeFileSync(manifestPath(target), JSON.stringify(manifest, null, 2), "utf8");

  console.log(`\nDone. Inline captures: ${inlineCount}, total manifest: ${manifest.pages.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
