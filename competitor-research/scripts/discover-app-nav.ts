#!/usr/bin/env tsx
/**
 * Log in (or reuse session), discover in-app nav links, update page-registry.json.
 * npm run research:discover -- --target convertlabs
 * npm run research:discover -- --target convertlabs --capture
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import { capturePage } from "./capture-page-lib";
import { loginAndSaveSession } from "./login-app";
import { registryPath, roleStoragePath, targetDir } from "./paths";
import { loadRegistry, parseArgs, requireArg, slugify, sleep } from "./utils";
import type { PageRegistry, RegistryPage } from "./types";

const APP_HOSTS = ["convertlabs.io", "app.convertlabs.io"];

function isAppUrl(href: string, base: string): boolean {
  try {
    const url = new URL(href, base);
    if (!APP_HOSTS.some((h) => url.hostname.endsWith(h))) return false;
    const path = url.pathname;
    // Exclude pure marketing pages
    const marketingOnly = [
      "/pricing",
      "/features",
      "/blog",
      "/about",
      "/contact",
      "/signup",
      "/login",
    ];
    if (marketingOnly.some((m) => path === m || path.startsWith(m + "/"))) {
      return false;
    }
    // Include authenticated app routes
    const appPrefixes = [
      "/get-started",
      "/dashboard",
      "/bookings",
      "/calendar",
      "/customers",
      "/service-providers",
      "/providers",
      "/payouts",
      "/quotes",
      "/invoices",
      "/discounts",
      "/marketing",
      "/websites",
      "/domains",
      "/settings",
      "/app",
    ];
    return appPrefixes.some((p) => path === p || path.startsWith(p + "/"));
  } catch {
    return false;
  }
}

async function discoverLinks(
  startUrl: string,
  storagePath: string,
): Promise<Array<{ text: string; href: string }>> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    storageState: storagePath,
  });
  const page = await context.newPage();

  try {
    await page.goto(startUrl, { waitUntil: "networkidle", timeout: 60_000 });
    await page.waitForTimeout(4000);

    const links = (await page.evaluate(`(() => {
      const norm = (s) => (s || "").replace(/\\s+/g, " ").trim();
      const seen = new Set();
      const results = [];

      const selectors = [
        "nav a[href]",
        "aside a[href]",
        "[class*='sidebar'] a[href]",
        "[class*='Sidebar'] a[href]",
        "[role='navigation'] a[href]",
        "[role='menu'] a[href]",
        "header a[href]",
        "a[href*='/dashboard']",
        "a[href*='bookings']",
        "a[href*='calendar']",
        "a[href*='customers']",
        "a[href*='settings']",
        "a[href*='services']",
        "a[href*='team']",
        "a[href*='marketing']",
        "a[href*='website']",
        "a[href*='payouts']",
        "a[href*='invoices']",
      ];

      for (const sel of selectors) {
        document.querySelectorAll(sel).forEach((el) => {
          const anchor = el.tagName === "A" ? el : el.closest("a");
          const href = (anchor && anchor.getAttribute("href")) || el.getAttribute("href") || "";
          const text = norm((anchor || el).textContent || el.getAttribute("aria-label") || "");
          const key = href + "|" + text;
          if (href && !seen.has(key)) {
            seen.add(key);
            results.push({ text, href });
          }
        });
      }
      return results;
    })()`)) as Array<{ text: string; href: string }>;

    // Also capture current page
    links.push({ text: "current", href: page.url() });

    await context.close();
    await browser.close();
    return links;
  } catch (err) {
    await context.close();
    await browser.close();
    throw err;
  }
}

function toAbsolute(href: string, base: string): string {
  try {
    return new URL(href, base).href.split("#")[0];
  } catch {
    return href;
  }
}

function pageIdFromUrl(url: string, text: string): string {
  try {
    const u = new URL(url);
    const slug = slugify(u.pathname.replace(/\//g, "-") + u.search.replace(/[?=&]/g, "-"));
    const label = slugify(text);
    return `app-${slug || label || "page"}`.replace(/-+/g, "-").slice(0, 80);
  } catch {
    return `app-${slugify(text || "page")}`;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const target = requireArg(args, "target");
  const shouldCapture = Boolean(args.capture);
  const forceLogin = Boolean(args.login);
  const force = Boolean(args.force);

  const registry = loadRegistry(target);
  const storagePath = roleStoragePath(target, "owner");

  if (forceLogin || !existsSync(storagePath)) {
    console.log("Logging in…");
    const login = await loginAndSaveSession({ target });
    console.log(`Session saved. Post-login URL: ${login.postLoginUrl}`);
  }

  const startUrl =
    existsSync(storagePath) && !forceLogin
      ? registry.appBaseUrl.replace(/\/dashboard$/, "/get-started")
      : registry.appBaseUrl;
  console.log(`Discovering nav from ${startUrl}…`);

  const rawLinks = await discoverLinks(startUrl, storagePath);
  const base = startUrl;

  const appLinks = rawLinks
    .map((l) => ({
      text: l.text,
      href: toAbsolute(l.href, base),
    }))
    .filter((l) => isAppUrl(l.href, base) || l.href.includes("dashboard"));

  // Dedupe by href
  const byHref = new Map<string, { text: string; href: string }>();
  for (const l of appLinks) {
    if (!byHref.has(l.href)) byHref.set(l.href, l);
  }

  const discovered = [...byHref.values()];
  console.log(`Found ${discovered.length} in-app URLs`);

  const existingIds = new Set(registry.pages.map((p) => p.id));
  const existingUrls = new Set(registry.pages.map((p) => p.url));
  const newPages: RegistryPage[] = [];

  for (const link of discovered) {
    if (existingUrls.has(link.href)) continue;

    let id = pageIdFromUrl(link.href, link.text);
    let n = 1;
    while (existingIds.has(id)) {
      id = `${id}-${n++}`;
    }
    existingIds.add(id);
    existingUrls.add(link.href);

    newPages.push({
      id,
      phase: "phase-04-owner-nav",
      url: link.href,
      role: "owner",
      source: "app",
      label: link.text || link.href,
      waitMs: 3000,
      discoveredFrom: "discover-app-nav",
    });
  }

  if (newPages.length > 0) {
    registry.pages.push(...newPages);
    const regPath = registryPath(target);
    writeFileSync(regPath, JSON.stringify(registry, null, 2), "utf8");
    console.log(`Added ${newPages.length} pages to ${regPath}`);
    for (const p of newPages) {
      console.log(`  + ${p.id}: ${p.url}`);
    }
  } else {
    console.log("No new pages to add.");
  }

  if (shouldCapture && newPages.length > 0) {
    console.log(`\nCapturing ${newPages.length} discovered pages…`);
    for (let i = 0; i < newPages.length; i++) {
      const page = newPages[i];
      console.log(`[${i + 1}/${newPages.length}] ${page.id}`);
      const result = await capturePage({ target, page, headless: true, force });
      console.log(`  ${result.status}`);
      if (i < newPages.length - 1) await sleep(registry.crawlDelayMs);
    }
  }

  // Also write discovery snapshot
  const snapshotPath = join(targetDir(target), "data", "discovered-nav.json");
  writeFileSync(
    snapshotPath,
    JSON.stringify({ discoveredAt: new Date().toISOString(), links: discovered }, null, 2),
    "utf8",
  );
  console.log(`Discovery snapshot: ${snapshotPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
