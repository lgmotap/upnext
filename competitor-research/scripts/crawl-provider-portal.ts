#!/usr/bin/env tsx
/**
 * Crawl ConvertLabs service provider portal (teams.convertlabs.io).
 * npm run research:crawl-provider -- --target convertlabs
 *
 * Magic link stored in targets/<target>/.provider-portal.local.json (gitignored):
 * { "signInUrl": "https://teams.convertlabs.io/signin?..." }
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import { captureCurrentPage } from "./capture-inline";
import { manifestPath, roleStoragePath, targetDir } from "./paths";
import { parseArgs, requireArg, slugify, sleep } from "./utils";
import type { CaptureManifest, RegistryPage } from "./types";

interface ProviderPortalConfig {
  signInUrl: string;
  baseUrl?: string;
}

function loadProviderConfig(target: string): ProviderPortalConfig {
  const path = join(targetDir(target), ".provider-portal.local.json");
  if (!existsSync(path)) {
    throw new Error(
      `Missing ${path}\nAdd { "signInUrl": "https://teams.convertlabs.io/signin?..." }`,
    );
  }
  return JSON.parse(readFileSync(path, "utf8")) as ProviderPortalConfig;
}

function providerStoragePath(target: string): string {
  return join(targetDir(target), "roles", "provider-portal.storage.json");
}

function providerDataDir(target: string): string {
  return join(targetDir(target), "data", "provider-portal");
}

function providerScreenshotDir(target: string): string {
  return join(targetDir(target), "screenshots", "provider-portal");
}

function providerPagePaths(target: string, pageId: string): {
  jsonPath: string;
  screenshotPath: string;
} {
  const dataDir = providerDataDir(target);
  const shotDir = providerScreenshotDir(target);
  mkdirSync(dataDir, { recursive: true });
  mkdirSync(shotDir, { recursive: true });
  return {
    jsonPath: join(dataDir, `${pageId}.json`),
    screenshotPath: join(shotDir, `${pageId}.png`),
  };
}

async function captureProviderPage(
  target: string,
  page: Page,
  meta: RegistryPage,
): Promise<{ jsonPath: string; screenshotPath: string }> {
  const { jsonPath, screenshotPath } = providerPagePaths(target, meta.id);
  // Override capture paths by writing directly (captureCurrentPage uses default paths)
  const paths = await captureCurrentPage(target, page, meta);

  // Move/copy to provider-portal subfolder
  const { readFileSync: read, writeFileSync: write } = await import("node:fs");
  write(jsonPath, read(paths.jsonPath, "utf8"), "utf8");
  const { copyFileSync } = await import("node:fs");
  copyFileSync(paths.screenshotPath, screenshotPath);

  return { jsonPath, screenshotPath };
}

async function discoverNavItems(page: Page): Promise<string[]> {
  return (await page.evaluate(`(() => {
    const norm = (s) => (s || "").replace(/\\s+/g, " ").trim();
    const seen = new Set();
    const items = [];
    const selectors = [
      "nav a", "nav button", "aside a", "aside button",
      "[role='navigation'] a", "[role='tab']", "header a", "header button",
      ".bottom-nav a", ".bottom-nav button", "[class*='tab-bar'] a",
      "[class*='navbar'] a", "[class*='menu'] a"
    ];
    for (const sel of selectors) {
      document.querySelectorAll(sel).forEach((el) => {
        const text = norm(el.textContent || el.getAttribute("aria-label") || "");
        if (text && text.length < 60 && !seen.has(text)) {
          seen.add(text);
          items.push(text);
        }
      });
    }
    return items;
  })()`)) as string[];
}

async function discoverLinks(page: Page): Promise<string[]> {
  return (await page.evaluate(`(() => {
    const urls = new Set();
    document.querySelectorAll("a[href]").forEach((a) => {
      try {
        const u = new URL(a.getAttribute("href") || "", window.location.href);
        if (u.hostname.includes("convertlabs.io")) urls.add(u.href.split("#")[0]);
      } catch {}
    });
    return [...urls];
  })()`)) as string[];
}

async function safeClick(page: Page, label: string): Promise<boolean> {
  const locators = [
    page.getByRole("link", { name: label, exact: true }),
    page.getByRole("button", { name: label, exact: true }),
    page.getByRole("tab", { name: label, exact: true }),
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

async function closeOverlays(page: Page): Promise<void> {
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(400);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const target = requireArg(args, "target");
  const config = loadProviderConfig(target);
  const baseUrl = config.baseUrl ?? "https://teams.convertlabs.io";

  const manifest: CaptureManifest = existsSync(manifestPath(target))
    ? (JSON.parse(readFileSync(manifestPath(target), "utf8")) as CaptureManifest)
    : { target, generatedAt: new Date().toISOString(), pages: [] };
  const manifestById = new Map(manifest.pages.map((p) => [p.pageId, p]));

  const storagePath = providerStoragePath(target);
  mkdirSync(join(targetDir(target), "roles"), { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    storageState: existsSync(storagePath) ? storagePath : undefined,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });
  const page = await context.newPage();

  const captured: Array<{ id: string; label: string; url: string }> = [];

  let activePage = page;

  async function snap(id: string, label: string, phase: string, waitMs = 2500): Promise<void> {
    const meta: RegistryPage = {
      id,
      phase,
      url: activePage.url(),
      role: "provider",
      source: "portal",
      label,
      waitMs,
    };
    const paths = await captureProviderPage(target, activePage, meta);
    captured.push({ id, label, url: activePage.url() });
    manifestById.set(id, {
      pageId: id,
      phase,
      role: "provider",
      url: activePage.url(),
      capturedAt: new Date().toISOString(),
      jsonPath: paths.jsonPath,
      screenshotPath: paths.screenshotPath,
      status: "ok",
    });
    console.log(`  ✓ ${label} → ${activePage.url()}`);
  }

  console.log("\n=== Provider portal — sign in ===");
  await activePage.goto(config.signInUrl, { waitUntil: "networkidle", timeout: 90_000 });
  await activePage.waitForTimeout(4000);

  const afterLoginUrl = activePage.url();
  const bodySample = await activePage.locator("body").innerText().catch(() => "");
  console.log(`Landed on: ${afterLoginUrl}`);
  console.log(`Body sample: ${bodySample.replace(/\s+/g, " ").slice(0, 200)}`);

  await snap("provider-signin-landing", "Provider — after magic link sign-in", "phase-14-provider-app");

  await context.storageState({ path: storagePath });
  console.log(`Session saved: ${storagePath}`);
  await context.close();

  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    storageState: storagePath,
  });
  activePage = await desktopContext.newPage();

  console.log("\n=== Provider portal — navigation discovery ===");
  await activePage.goto(afterLoginUrl.includes("teams.convertlabs") ? afterLoginUrl : baseUrl, {
    waitUntil: "networkidle",
    timeout: 60_000,
  });
  await activePage.waitForTimeout(3000);

  const navItems = await discoverNavItems(activePage);
  console.log(`Nav items: ${navItems.join(" | ") || "(none detected)"}`);

  await snap("provider-dashboard-desktop", "Provider — dashboard (desktop)", "phase-14-provider-app");

  // BFS internal links on teams.convertlabs.io
  const visited = new Set<string>();
  const queue = [activePage.url(), baseUrl, `${baseUrl}/`];
  const discoveredLinks = await discoverLinks(activePage);
  queue.push(...discoveredLinks);

  console.log("\n=== Provider portal — BFS crawl ===");
  while (queue.length > 0) {
    const rawUrl = queue.shift()!;
    let url: string;
    try {
      url = new URL(rawUrl).href.split("#")[0];
    } catch {
      continue;
    }
    if (!url.includes("teams.convertlabs.io") || visited.has(url)) continue;
    visited.add(url);

    console.log(`→ ${url}`);
    try {
      await activePage.goto(url, { waitUntil: "networkidle", timeout: 45_000 });
      await activePage.waitForTimeout(2500);
    } catch (err) {
      console.log(`  skip: ${String(err)}`);
      continue;
    }

    const slug = slugify(new URL(url).pathname || "home");
    await snap(`provider-route-${slug}`, `Provider — route ${slug}`, "phase-14-provider-app");

    const tabs = await discoverNavItems(activePage);
    for (const tab of tabs.slice(0, 15)) {
      if (["Log Out", "Logout", "Sign out"].some((x) => tab.includes(x))) continue;
      await activePage.goto(url, { waitUntil: "networkidle", timeout: 45_000 });
      await activePage.waitForTimeout(1500);
      if (await safeClick(activePage, tab)) {
        await snap(
          `provider-tab-${slug}-${slugify(tab)}`,
          `Provider — ${slug} tab: ${tab}`,
          "phase-14-provider-app",
        );
      }
    }

    const moreLinks = await discoverLinks(activePage);
    for (const link of moreLinks) {
      if (!visited.has(link)) queue.push(link);
    }
    await sleep(1500);
  }

  // Click through known provider-app sections from help docs / App Store listing
  const knownSections = [
    "Bookings",
    "Jobs",
    "Schedule",
    "Availability",
    "Calendar",
    "Today",
    "Profile",
    "Settings",
    "Notifications",
    "Earnings",
    "Payouts",
    "Invites",
  ];

  console.log("\n=== Provider portal — known sections ===");
  await activePage.goto(baseUrl, { waitUntil: "networkidle", timeout: 60_000 }).catch(() => {});
  await activePage.waitForTimeout(2000);

  for (const section of knownSections) {
    await activePage.goto(baseUrl, { waitUntil: "networkidle", timeout: 60_000 }).catch(() => {});
    await activePage.waitForTimeout(1500);
    if (await safeClick(activePage, section)) {
      await snap(
        `provider-section-${slugify(section)}`,
        `Provider — section: ${section}`,
        "phase-14-provider-app",
      );
    }
  }

  // Job detail — navigate to My Jobs first, then click first assigned row
  console.log("\n=== Provider portal — job detail ===");
  await activePage.goto(baseUrl, { waitUntil: "networkidle", timeout: 60_000 }).catch(() => {});
  await activePage.waitForTimeout(2000);

  await safeClick(activePage, "My Jobs");
  await activePage.waitForTimeout(2000);
  await snap("provider-my-jobs-with-assignment", "Provider — My Jobs (assigned)", "phase-14-provider-app");

  // Job detail — pencil icon in last column opens Booking Details drawer
  const editIcon = activePage.locator("table tbody tr td:last-child .cell, table tbody tr td:last-child").first();
  const editClicked = await editIcon.isVisible({ timeout: 3000 }).catch(() => false);
  if (editClicked) {
    await editIcon.click();
    await activePage.waitForTimeout(3500);
    await snap("provider-job-detail-assigned", "Provider — job detail drawer (assigned)", "phase-14-provider-app");

    for (const action of [
      "Check-In",
      "On The Way",
      "Running Late",
    ]) {
      const btn = activePage.getByRole("button", { name: new RegExp(action.replace("-", "[\\- ]?"), "i") }).first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click();
        await activePage.waitForTimeout(2500);
        await snap(
          `provider-job-${slugify(action)}`,
          `Provider — job action: ${action}`,
          "phase-14-provider-app",
        );
        await closeOverlays(activePage);
        await activePage.goto(baseUrl, { waitUntil: "networkidle", timeout: 60_000 }).catch(() => {});
        await activePage.waitForTimeout(1500);
        await safeClick(activePage, "My Jobs");
        await activePage.waitForTimeout(1500);
        await activePage.locator("table tbody tr td:last-child .cell, table tbody tr td:last-child").first().click().catch(() => {});
        await activePage.waitForTimeout(2500);
      }
    }
  } else {
    console.log("  No job rows / edit icon on My Jobs");
  }

  // Mobile viewport pass
  console.log("\n=== Provider portal — mobile viewport ===");
  await desktopContext.close();

  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    storageState: storagePath,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });
  const mobilePage = await mobileContext.newPage();
  activePage = mobilePage;
  await mobilePage.goto(baseUrl, { waitUntil: "networkidle", timeout: 60_000 });
  await mobilePage.waitForTimeout(3000);

  // Temporarily use mobile page for snap
  const origUrl = activePage.url();

  const mobileNav = await discoverNavItems(activePage);
  for (const item of mobileNav.slice(0, 10)) {
    if (/log\s*out/i.test(item)) continue;
    await activePage.goto(origUrl, { waitUntil: "networkidle" }).catch(() => {});
    await activePage.waitForTimeout(1500);
    if (await safeClick(activePage, item)) {
      await snap(`provider-mobile-${slugify(item)}`, `Provider — mobile: ${item}`);
    }
  }

  // Mobile — My Jobs with assignment + row click
  await activePage.goto(origUrl, { waitUntil: "networkidle" }).catch(() => {});
  await activePage.waitForTimeout(1500);
  if (await safeClick(activePage, "My Jobs")) {
    await activePage.waitForTimeout(2000);
    await snap("provider-mobile-my-jobs-assigned", "Provider — mobile My Jobs (assigned)");
    const clicked = await activePage.evaluate(`(() => {
      const row = document.querySelector("table tbody tr");
      const cell = row?.querySelector("td:last-child .cell, td:last-child");
      if (cell) { cell.click(); return true; }
      return false;
    })()`);
    if (clicked) {
      await activePage.waitForTimeout(3000);
      await snap("provider-mobile-job-detail", "Provider — mobile job detail drawer");
    }
  }

  await mobileContext.close();
  await browser.close();

  // Index file
  writeFileSync(
    join(providerDataDir(target), "crawl-index.json"),
    JSON.stringify(
      {
        crawledAt: new Date().toISOString(),
        baseUrl,
        capturedCount: captured.length,
        pages: captured,
        visitedUrls: [...visited],
      },
      null,
      2,
    ),
    "utf8",
  );

  manifest.generatedAt = new Date().toISOString();
  manifest.pages = Array.from(manifestById.values()).sort((a, b) =>
    a.pageId.localeCompare(b.pageId),
  );
  writeFileSync(manifestPath(target), JSON.stringify(manifest, null, 2), "utf8");

  console.log(`\n=== Done ===`);
  console.log(`Provider captures: ${captured.length}`);
  console.log(`Data: ${providerDataDir(target)}`);
  console.log(`Screenshots: ${providerScreenshotDir(target)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
