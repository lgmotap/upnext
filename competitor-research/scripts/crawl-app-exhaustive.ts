#!/usr/bin/env tsx
/**
 * Exhaustive app crawl — sidebar, header menus, section tabs, modals, BFS link discovery.
 * npm run research:crawl-exhaustive -- --target convertlabs
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import { captureCurrentPage } from "./capture-inline";
import { loginAndSaveSession } from "./login-app";
import { manifestPath, roleStoragePath, targetDir } from "./paths";
import { loadRegistry, parseArgs, requireArg, slugify, sleep } from "./utils";
import type { CaptureManifest, RegistryPage } from "./types";

const APP_ORIGIN = "https://convertlabs.io";

const MARKETING_PATHS = new Set([
  "/",
  "/pricing",
  "/features",
  "/blog",
  "/about",
  "/contact",
  "/signup",
  "/login",
]);

/** Header / top-bar items to open and capture */
const HEADER_TRIGGERS = [
  "Share & Earn",
  "Help Center",
  "Fresh Home Cleaning",
  "Luis Pimentel",
  "Search",
];

/** Sidebar sections */
const SIDEBAR_SECTIONS = [
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

/** Seed URLs from prior discovery — ensures we don't miss deep routes */
const SEED_URLS = [
  `${APP_ORIGIN}/get-started`,
  `${APP_ORIGIN}/dashboard`,
  `${APP_ORIGIN}/company`,
  `${APP_ORIGIN}/booking/bookings`,
  `${APP_ORIGIN}/booking/bookings/new-booking`,
  `${APP_ORIGIN}/booking/calendar`,
  `${APP_ORIGIN}/booking/customer`,
  `${APP_ORIGIN}/booking/customer/new`,
  `${APP_ORIGIN}/booking/service-providers`,
  `${APP_ORIGIN}/booking/activity`,
  `${APP_ORIGIN}/booking/reports`,
  `${APP_ORIGIN}/booking/quotes`,
  `${APP_ORIGIN}/booking/invoices`,
  `${APP_ORIGIN}/booking/discounts`,
  `${APP_ORIGIN}/booking/services/edit`,
  `${APP_ORIGIN}/booking/settings`,
  `${APP_ORIGIN}/booking/settings/?t=integrations`,
  `${APP_ORIGIN}/marketing`,
  `${APP_ORIGIN}/marketing/leads`,
  `${APP_ORIGIN}/marketing/widgets`,
  `${APP_ORIGIN}/marketing/automations`,
  `${APP_ORIGIN}/marketing/campaigns`,
  `${APP_ORIGIN}/websites/theme-selection`,
  `${APP_ORIGIN}/websites/`,
  `${APP_ORIGIN}/domains/`,
  `${APP_ORIGIN}/domains/domain-selection`,
];

const MODAL_TRIGGERS = [
  "New Booking",
  "New Customer",
  "New Service",
  "New Provider",
  "New Quote",
  "New Invoice",
  "New Discount",
  "Add",
  "Create",
];

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    return u.href.replace(/\/$/, "");
  } catch {
    return url;
  }
}

function isAppUrl(href: string): boolean {
  try {
    const u = new URL(href, APP_ORIGIN);
    if (!u.hostname.endsWith("convertlabs.io")) return false;
    if (u.hostname.startsWith("help.")) return false;
    const path = u.pathname;
    if (MARKETING_PATHS.has(path)) return false;
    if (path.startsWith("/features")) return false;
    if (path.startsWith("/signup")) return false;
    // Include app routes
    return (
      path.startsWith("/get-started") ||
      path.startsWith("/dashboard") ||
      path.startsWith("/booking") ||
      path.startsWith("/marketing") ||
      path.startsWith("/websites") ||
      path.startsWith("/domains") ||
      path.startsWith("/company") ||
      path.startsWith("/booking_form")
    );
  } catch {
    return false;
  }
}

function pageId(prefix: string, label: string, url?: string): string {
  const base = slugify(`${prefix}-${label}`);
  if (url) {
    try {
      const u = new URL(url);
      const pathPart = slugify(u.pathname + u.search);
      return `app-${base}-${pathPart}`.replace(/-+/g, "-").slice(0, 90);
    } catch {
      // fall through
    }
  }
  return `app-${base}`.slice(0, 90);
}

async function ensureSession(target: string, forceLogin: boolean): Promise<string> {
  const storagePath = roleStoragePath(target, "owner");
  if (forceLogin || !existsSync(storagePath)) {
    const result = await loginAndSaveSession({ target });
    return result.storagePath;
  }
  return storagePath;
}

async function discoverLinks(page: Page): Promise<Array<{ text: string; href: string }>> {
  return (await page.evaluate(`(() => {
    const norm = (s) => (s || "").replace(/\\s+/g, " ").trim();
    const seen = new Set();
    const out = [];
    document.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href") || "";
      const text = norm(a.textContent || a.getAttribute("aria-label") || "");
      const key = href + "|" + text;
      if (href && !seen.has(key)) {
        seen.add(key);
        out.push({ text, href });
      }
    });
    return out;
  })()`)) as Array<{ text: string; href: string }>;
}

async function discoverTabs(page: Page): Promise<string[]> {
  return (await page.evaluate(`(() => {
    const norm = (s) => (s || "").replace(/\\s+/g, " ").trim();
    const seen = new Set();
    const tabs = [];
    document.querySelectorAll("[role='tab']").forEach((el) => {
      const text = norm(el.textContent);
      if (text && text.length < 60 && !seen.has(text)) {
        seen.add(text);
        tabs.push(text);
      }
    });
    return tabs;
  })()`)) as string[];
}

async function discoverMenuItems(page: Page): Promise<string[]> {
  return (await page.evaluate(`(() => {
    const norm = (s) => (s || "").replace(/\\s+/g, " ").trim();
    const items = [];
    const seen = new Set();
    document.querySelectorAll(
      "[role='menuitem'], [role='menu'] a, [role='menu'] button, [class*='dropdown'] a, [class*='dropdown'] button, [class*='popover'] a, [class*='popover'] button"
    ).forEach((el) => {
      const text = norm(el.textContent || el.getAttribute("aria-label") || "");
      if (text && text.length < 80 && !seen.has(text)) {
        seen.add(text);
        items.push(text);
      }
    });
    return items;
  })()`)) as string[];
}

async function safeClick(page: Page, label: string): Promise<boolean> {
  const locators = [
    page.getByRole("link", { name: label, exact: true }),
    page.getByRole("button", { name: label, exact: true }),
    page.getByRole("tab", { name: label, exact: true }),
    page.getByRole("menuitem", { name: label, exact: true }),
    page.locator(`nav >> text="${label}"`).first(),
    page.locator(`aside >> text="${label}"`).first(),
    page.locator(`header >> text="${label}"`).first(),
    page.getByText(label, { exact: true }).first(),
  ];

  for (const loc of locators) {
    try {
      if (await loc.isVisible({ timeout: 1500 })) {
        await loc.click({ timeout: 5000 });
        await page.waitForTimeout(2000);
        return true;
      }
    } catch {
      // next
    }
  }
  return false;
}

async function closeOverlays(page: Page): Promise<void> {
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(500);
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(300);
}

function recordManifest(
  manifestById: Map<string, CaptureManifest["pages"][0]>,
  meta: RegistryPage,
  paths: { jsonPath: string; screenshotPath: string },
) {
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
}

async function capture(
  target: string,
  page: Page,
  manifestById: Map<string, CaptureManifest["pages"][0]>,
  meta: RegistryPage,
  capturedIds: Set<string>,
): Promise<void> {
  if (capturedIds.has(meta.id)) return;
  capturedIds.add(meta.id);

  const paths = await captureCurrentPage(target, page, meta);
  recordManifest(manifestById, meta, paths);
  console.log(`  ✓ ${meta.label} [${meta.id}]`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const target = requireArg(args, "target");
  const forceLogin = Boolean(args.login);

  const registry = loadRegistry(target);
  const storagePath = await ensureSession(target, forceLogin);

  const manifest: CaptureManifest = existsSync(manifestPath(target))
    ? (JSON.parse(readFileSync(manifestPath(target), "utf8")) as CaptureManifest)
    : { target, generatedAt: new Date().toISOString(), pages: [] };
  const manifestById = new Map(manifest.pages.map((p) => [p.pageId, p]));
  const capturedIds = new Set(manifest.pages.map((p) => p.pageId));
  const visitedUrls = new Set<string>();
  const urlQueue: string[] = [...SEED_URLS];

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    storageState: storagePath,
  });
  const page = await context.newPage();

  const appUrl = registry.appLoginUrl ?? `${APP_ORIGIN}/get-started`;
  await page.goto(appUrl, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(3000);

  // ── 1. Sidebar sections ──────────────────────────────────────────
  console.log("\n=== Sidebar sections ===");
  for (const section of SIDEBAR_SECTIONS) {
    console.log(`→ ${section}`);
    await closeOverlays(page);
    if (!(await safeClick(page, section))) {
      console.log(`  skip (not found)`);
      continue;
    }

    const url = normalizeUrl(page.url());
    visitedUrls.add(url);
    await capture(target, page, manifestById, {
      id: pageId("nav", section, url),
      phase: section === "Settings" ? "phase-15-settings" : "phase-04-owner-nav",
      url,
      role: "owner",
      source: "app",
      label: `Nav — ${section}`,
      waitMs: 2000,
    }, capturedIds);

    // Section tabs (e.g. Marketing: Overview, Leads, ...)
    const tabs = await discoverTabs(page);
    for (const tab of tabs) {
      await closeOverlays(page);
      if (!(await safeClick(page, tab))) continue;
      const tabUrl = normalizeUrl(page.url());
      await capture(target, page, manifestById, {
        id: pageId(`tab-${slugify(section)}`, tab, tabUrl),
        phase: "phase-04-owner-nav",
        url: tabUrl,
        role: "owner",
        source: "app",
        label: `${section} — tab: ${tab}`,
        waitMs: 2000,
      }, capturedIds);
    }

    // Settings: dedicated pass
    if (section === "Settings") {
      const settingsTabs = await discoverTabs(page);
      console.log(`  Settings tabs: ${settingsTabs.join(", ")}`);
      for (const tab of settingsTabs) {
        await closeOverlays(page);
        await safeClick(page, "Settings");
        await page.waitForTimeout(1000);
        if (!(await safeClick(page, tab))) continue;
        await capture(target, page, manifestById, {
          id: pageId("settings", tab),
          phase: "phase-15-settings",
          url: normalizeUrl(page.url()),
          role: "owner",
          source: "app",
          label: `Settings — ${tab}`,
          waitMs: 2500,
        }, capturedIds);

        // Sub-links inside settings tab (e.g. service edit)
        const subLinks = (await discoverLinks(page))
          .map((l) => ({ ...l, href: new URL(l.href, APP_ORIGIN).href }))
          .filter((l) => isAppUrl(l.href) && l.href.includes("/booking"));
        for (const sub of subLinks.slice(0, 15)) {
          const subUrl = normalizeUrl(sub.href);
          if (visitedUrls.has(subUrl)) continue;
          urlQueue.push(subUrl);
        }
      }
    }
  }

  // ── 2. Header / top menus ────────────────────────────────────────
  console.log("\n=== Header menus ===");
  await page.goto(appUrl, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(2000);

  for (const trigger of HEADER_TRIGGERS) {
    console.log(`→ header: ${trigger}`);
    await closeOverlays(page);
    if (!(await safeClick(page, trigger))) {
      console.log(`  skip`);
      continue;
    }

    await capture(target, page, manifestById, {
      id: pageId("header", trigger),
      phase: "phase-04-owner-nav",
      url: normalizeUrl(page.url()),
      role: "owner",
      source: "app",
      label: `Header — ${trigger}`,
      waitMs: 1500,
    }, capturedIds);

    const menuItems = await discoverMenuItems(page);
    for (const item of menuItems) {
      if (["Sign out", "Logout", "Log out"].some((x) => item.includes(x))) continue;
      await closeOverlays(page);
      await safeClick(page, trigger);
      await page.waitForTimeout(500);
      if (!(await safeClick(page, item))) continue;
      await capture(target, page, manifestById, {
        id: pageId(`header-${slugify(trigger)}`, item),
        phase: "phase-04-owner-nav",
        url: normalizeUrl(page.url()),
        role: "owner",
        source: "app",
        label: `Header ${trigger} → ${item}`,
        waitMs: 2000,
      }, capturedIds);
      const itemUrl = normalizeUrl(page.url());
      if (isAppUrl(itemUrl)) urlQueue.push(itemUrl);
    }
    await closeOverlays(page);
  }

  // ── 3. BFS URL crawl ─────────────────────────────────────────────
  console.log("\n=== BFS link crawl ===");
  while (urlQueue.length > 0) {
    const rawUrl = urlQueue.shift()!;
    const url = normalizeUrl(rawUrl);
    if (visitedUrls.has(url) || !isAppUrl(url)) continue;
    visitedUrls.add(url);

    console.log(`→ ${url}`);
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 45_000 });
      await page.waitForTimeout(2500);
    } catch (err) {
      console.log(`  ERROR navigate: ${String(err)}`);
      continue;
    }

    const pathSlug = slugify(new URL(url).pathname + new URL(url).search);
    await capture(target, page, manifestById, {
      id: `app-route-${pathSlug}`.slice(0, 90),
      phase: "phase-04-owner-nav",
      url,
      role: "owner",
      source: "app",
      label: `Route — ${pathSlug}`,
      waitMs: 2000,
    }, capturedIds);

    // Discover more links
    const links = await discoverLinks(page);
    for (const link of links) {
      try {
        const abs = normalizeUrl(new URL(link.href, url).href);
        if (isAppUrl(abs) && !visitedUrls.has(abs)) {
          urlQueue.push(abs);
        }
      } catch {
        // skip
      }
    }

    // Tabs on this page
    const tabs = await discoverTabs(page);
    for (const tab of tabs) {
      await closeOverlays(page);
      await page.goto(url, { waitUntil: "networkidle", timeout: 45_000 });
      await page.waitForTimeout(1500);
      if (!(await safeClick(page, tab))) continue;
      await capture(target, page, manifestById, {
        id: pageId(`route-tab-${pathSlug}`, tab),
        phase: "phase-04-owner-nav",
        url: normalizeUrl(page.url()),
        role: "owner",
        source: "app",
        label: `Route ${pathSlug} — tab: ${tab}`,
        waitMs: 2000,
      }, capturedIds);
    }

    await sleep(registry.crawlDelayMs);
  }

  // ── 4. Modals ────────────────────────────────────────────────────
  console.log("\n=== Modals ===");
  const modalPages = [
    `${APP_ORIGIN}/booking/bookings`,
    `${APP_ORIGIN}/booking/customer`,
    `${APP_ORIGIN}/booking/settings`,
    `${APP_ORIGIN}/booking/service-providers`,
    `${APP_ORIGIN}/booking/quotes`,
    `${APP_ORIGIN}/booking/invoices`,
    `${APP_ORIGIN}/booking/discounts`,
  ];

  for (const modalPageUrl of modalPages) {
    await page.goto(modalPageUrl, { waitUntil: "networkidle", timeout: 45_000 });
    await page.waitForTimeout(2000);

    for (const trigger of MODAL_TRIGGERS) {
      await closeOverlays(page);
      const clicked = await safeClick(page, trigger);
      if (!clicked) continue;

      const hasDialog = await page
        .locator('[role="dialog"], [aria-modal="true"]')
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      if (!hasDialog) {
        // Might have navigated to new page instead
        const newUrl = normalizeUrl(page.url());
        if (newUrl !== normalizeUrl(modalPageUrl)) {
          await capture(target, page, manifestById, {
            id: pageId("modal-nav", trigger, newUrl),
            phase: "phase-05-bookings",
            url: newUrl,
            role: "owner",
            source: "app",
            label: `Modal/nav — ${trigger}`,
            waitMs: 2000,
          }, capturedIds);
        }
        await page.goto(modalPageUrl, { waitUntil: "networkidle", timeout: 45_000 });
        continue;
      }

      await capture(target, page, manifestById, {
        id: pageId("modal", trigger, modalPageUrl),
        phase: "phase-05-bookings",
        url: modalPageUrl,
        role: "owner",
        source: "app",
        label: `Modal — ${trigger} @ ${new URL(modalPageUrl).pathname}`,
        waitMs: 1500,
      }, capturedIds);

      await closeOverlays(page);
      await page.goto(modalPageUrl, { waitUntil: "networkidle", timeout: 45_000 });
      await page.waitForTimeout(1000);
    }
  }

  await context.close();
  await browser.close();

  // Save crawl index
  const crawlIndex = {
    crawledAt: new Date().toISOString(),
    visitedUrls: [...visitedUrls].sort(),
    capturedCount: capturedIds.size,
    capturedIds: [...capturedIds].sort(),
  };
  writeFileSync(
    join(targetDir(target), "data", "crawl-index.json"),
    JSON.stringify(crawlIndex, null, 2),
    "utf8",
  );

  manifest.generatedAt = new Date().toISOString();
  manifest.pages = Array.from(manifestById.values()).sort((a, b) =>
    a.pageId.localeCompare(b.pageId),
  );
  writeFileSync(manifestPath(target), JSON.stringify(manifest, null, 2), "utf8");

  console.log(`\n=== Done ===`);
  console.log(`Visited URLs: ${visitedUrls.size}`);
  console.log(`Total captures: ${manifest.pages.length}`);
  console.log(`Index: ${join(targetDir(target), "data", "crawl-index.json")}`);
}

const isDirectRun = process.argv[1]?.includes("crawl-app-exhaustive");
if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
