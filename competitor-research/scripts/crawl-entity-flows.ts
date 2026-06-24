#!/usr/bin/env tsx
/**
 * Capture create flows + row action menus for Service Providers, Quotes, Invoices.
 * npm run research:crawl-entities -- --target convertlabs
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { chromium, type Page } from "playwright";
import { captureCurrentPage } from "./capture-inline";
import { capturePage } from "./capture-page-lib";
import { manifestPath, roleStoragePath } from "./paths";
import { parseArgs, requireArg, slugify, sleep } from "./utils";
import type { CaptureManifest, RegistryPage } from "./types";

async function closeOverlays(page: Page): Promise<void> {
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(400);
}

async function discoverTabs(page: Page): Promise<string[]> {
  return (await page.evaluate(`(() => {
    const norm = (s) => (s || "").replace(/\\s+/g, " ").trim();
    const seen = new Set();
    const tabs = [];
    document.querySelectorAll("[role='tab']").forEach((el) => {
      const text = norm(el.textContent);
      if (text && text.length < 80 && !seen.has(text)) {
        seen.add(text);
        tabs.push(text);
      }
    });
    return tabs;
  })()`)) as string[];
}

async function clickTab(page: Page, label: string): Promise<boolean> {
  const locators = [
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

async function clickButton(page: Page, label: string | RegExp): Promise<boolean> {
  const locators = [
    typeof label === "string"
      ? page.getByRole("button", { name: label, exact: true })
      : page.getByRole("button", { name: label }),
    typeof label === "string"
      ? page.getByRole("link", { name: label, exact: true })
      : page.getByRole("link", { name: label }),
    typeof label === "string"
      ? page.locator(`button:has-text("${label}")`).first()
      : page.locator("button").filter({ hasText: label }).first(),
  ];
  for (const loc of locators) {
    try {
      if (await loc.isVisible({ timeout: 2500 })) {
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

async function openRowMoreMenu(page: Page): Promise<boolean> {
  // Element UI / common patterns for row "more" actions
  const selectors = [
    "table tbody tr:first-child .el-dropdown",
    "table tbody tr:first-child button[class*='more']",
    "table tbody tr:first-child .el-icon-more",
    "table tbody tr:first-child .el-icon-arrow-down",
    "table tbody tr:first-child button:has(.el-icon-more)",
    "table tbody tr:first-child [aria-label='More']",
    "table tbody tr .el-button--text:last-child",
    "table tbody tr button[class*='dropdown']",
    "table tbody tr:first-child td:last-child button:last-child",
    "table tbody tr:first-child td:last-child .el-dropdown-selfdefine",
  ];

  for (const sel of selectors) {
    try {
      const loc = page.locator(sel).first();
      if (await loc.isVisible({ timeout: 1500 })) {
        await loc.click({ force: true, timeout: 5000 });
        await page.waitForTimeout(1200);
        const menuItems = await page.locator(".el-dropdown-menu__item, [role='menuitem']").count();
        if (menuItems > 0) return true;
      }
    } catch {
      // continue
    }
  }

  // Click last icon button in first data row
  const clicked = await page.evaluate(`(() => {
    const row = document.querySelector("table tbody tr");
    if (!row) return false;
    const buttons = row.querySelectorAll("button, .el-dropdown, [class*='cursor-pointer']");
    const last = buttons[buttons.length - 1];
    if (last) {
      last.click();
      return true;
    }
    return false;
  })()`);
  await page.waitForTimeout(1200);
  return clicked;
}

async function getDropdownItems(page: Page): Promise<string[]> {
  return (await page.evaluate(`(() => {
    const norm = (s) => (s || "").replace(/\\s+/g, " ").trim();
    const items = [];
    const seen = new Set();
    document.querySelectorAll(".el-dropdown-menu__item, [role='menuitem']").forEach((el) => {
      const text = norm(el.textContent);
      if (text && text.length < 120 && !seen.has(text)) {
        seen.add(text);
        items.push(text);
      }
    });
    return items;
  })()`)) as string[];
}

async function captureInline(
  target: string,
  page: Page,
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

async function captureRoute(
  target: string,
  manifestById: Map<string, CaptureManifest["pages"][0]>,
  meta: RegistryPage,
  force: boolean,
): Promise<void> {
  const result = await capturePage({ target, page: meta, headless: true, force });
  if (result.status === "ok" && result.jsonPath && result.screenshotPath) {
    manifestById.set(meta.id, {
      pageId: meta.id,
      phase: meta.phase,
      role: meta.role,
      url: meta.url,
      capturedAt: new Date().toISOString(),
      jsonPath: result.jsonPath,
      screenshotPath: result.screenshotPath,
      status: "ok",
    });
    console.log(`  ✓ ${meta.label}`);
  } else {
    console.log(`  ✗ ${meta.label}: ${result.error ?? result.status}`);
  }
}

async function captureCreateFlow(
  target: string,
  page: Page,
  manifestById: Map<string, CaptureManifest["pages"][0]>,
  opts: {
    entity: string;
    listUrl: string;
    newButton: string;
    newUrl?: string;
    phase: string;
  },
): Promise<void> {
  console.log(`\n=== ${opts.entity} — create flow ===`);

  if (opts.newUrl) {
    await page.goto(opts.newUrl, { waitUntil: "networkidle", timeout: 60_000 });
  } else {
    await page.goto(opts.listUrl, { waitUntil: "networkidle", timeout: 60_000 });
    await page.waitForTimeout(2000);
    if (!(await clickButton(page, opts.newButton))) {
      console.log(`  WARN: could not click "${opts.newButton}"`);
      return;
    }
  }

  await captureInline(target, page, manifestById, {
    id: `app-entity-${slugify(opts.entity)}-new-form`,
    phase: opts.phase,
    url: page.url(),
    role: "owner",
    source: "app",
    label: `${opts.entity} — New form`,
    waitMs: 2500,
  });

  const tabs = await discoverTabs(page);
  if (tabs.length) {
    console.log(`  Tabs: ${tabs.join(", ")}`);
    for (const tab of tabs) {
      await page.goto(page.url(), { waitUntil: "networkidle", timeout: 60_000 }).catch(() => {});
      await page.waitForTimeout(1500);
      if (!(await clickTab(page, tab))) continue;
      await captureInline(target, page, manifestById, {
        id: `app-entity-${slugify(opts.entity)}-new-tab-${slugify(tab)}`,
        phase: opts.phase,
        url: page.url(),
        role: "owner",
        source: "app",
        label: `${opts.entity} — New form tab: ${tab}`,
        waitMs: 2000,
      });
    }
  }
}

async function captureListRowActions(
  target: string,
  page: Page,
  manifestById: Map<string, CaptureManifest["pages"][0]>,
  opts: {
    entity: string;
    listUrl: string;
    phase: string;
  },
): Promise<void> {
  console.log(`\n=== ${opts.entity} — list row actions ===`);

  await page.goto(opts.listUrl, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(3000);

  const hasRows = await page.locator("table tbody tr").first().isVisible().catch(() => false);
  if (!hasRows) {
    console.log("  WARN: no table rows — skipping row actions");
    return;
  }

  await captureInline(target, page, manifestById, {
    id: `app-entity-${slugify(opts.entity)}-list-with-data`,
    phase: opts.phase,
    url: page.url(),
    role: "owner",
    source: "app",
    label: `${opts.entity} — list with data`,
    waitMs: 2000,
  });

  // Row action buttons: edit (usually 2nd-to-last), delete, more
  const actionLabels = ["Edit", "Delete"];
  for (const action of actionLabels) {
    await page.goto(opts.listUrl, { waitUntil: "networkidle", timeout: 60_000 });
    await page.waitForTimeout(2000);
    const row = page.locator("table tbody tr").first();
    const btn = row.locator(`button[title='${action}'], button[aria-label='${action}']`).first();
    try {
      if (await btn.isVisible({ timeout: 1500 })) {
        await btn.click({ force: true });
        await page.waitForTimeout(1500);
        await captureInline(target, page, manifestById, {
          id: `app-entity-${slugify(opts.entity)}-row-${slugify(action)}`,
          phase: opts.phase,
          url: page.url(),
          role: "owner",
          source: "app",
          label: `${opts.entity} — row ${action}`,
          waitMs: 2000,
        });
        await closeOverlays(page);
      }
    } catch {
      // try icon buttons by position in row
    }
  }

  // Edit via first row pencil — click buttons in actions column
  await page.goto(opts.listUrl, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(2000);
  const editClicked = await page.evaluate(`(() => {
    const row = document.querySelector("table tbody tr");
    if (!row) return false;
    const cells = row.querySelectorAll("td");
    const lastCell = cells[cells.length - 1];
    if (!lastCell) return false;
    const buttons = lastCell.querySelectorAll("button");
    if (buttons.length >= 1) {
      buttons[0].click();
      return true;
    }
    return false;
  })()`);
  if (editClicked) {
    await page.waitForTimeout(2500);
    await captureInline(target, page, manifestById, {
      id: `app-entity-${slugify(opts.entity)}-row-edit-detail`,
      phase: opts.phase,
      url: page.url(),
      role: "owner",
      source: "app",
      label: `${opts.entity} — edit/detail view`,
      waitMs: 2500,
    });

    const detailTabs = await discoverTabs(page);
    for (const tab of detailTabs) {
      if (await clickTab(page, tab)) {
        await captureInline(target, page, manifestById, {
          id: `app-entity-${slugify(opts.entity)}-detail-tab-${slugify(tab)}`,
          phase: opts.phase,
          url: page.url(),
          role: "owner",
          source: "app",
          label: `${opts.entity} — detail tab: ${tab}`,
          waitMs: 2000,
        });
      }
    }
  }

  // More menu (three dots)
  await page.goto(opts.listUrl, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(2000);

  if (await openRowMoreMenu(page)) {
    const items = await getDropdownItems(page);
    console.log(`  More menu items: ${items.join(" | ")}`);

    await captureInline(target, page, manifestById, {
      id: `app-entity-${slugify(opts.entity)}-row-more-menu`,
      phase: opts.phase,
      url: opts.listUrl,
      role: "owner",
      source: "app",
      label: `${opts.entity} — row More menu`,
      waitMs: 1000,
    });

    for (const item of items) {
      await page.goto(opts.listUrl, { waitUntil: "networkidle", timeout: 60_000 });
      await page.waitForTimeout(2000);
      if (!(await openRowMoreMenu(page))) continue;

      const itemLoc = page
        .locator(".el-dropdown-menu__item, [role='menuitem']")
        .filter({ hasText: item })
        .first();

      try {
        if (await itemLoc.isVisible({ timeout: 2000 })) {
          await itemLoc.click({ timeout: 5000 });
          await page.waitForTimeout(2500);

          // Capture result — modal, new page, or confirm dialog
          await captureInline(target, page, manifestById, {
            id: `app-entity-${slugify(opts.entity)}-more-${slugify(item)}`,
            phase: opts.phase,
            url: page.url(),
            role: "owner",
            source: "app",
            label: `${opts.entity} — More → ${item}`,
            waitMs: 2000,
          });

          await closeOverlays(page);
        }
      } catch (err) {
        console.log(`    skip "${item}": ${String(err)}`);
      }
    }
  } else {
    console.log("  WARN: could not open More menu");
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const target = requireArg(args, "target");
  const force = Boolean(args.force);
  const storagePath = roleStoragePath(target, "owner");

  if (!existsSync(storagePath)) {
    throw new Error("No session — run: npm run research:login -- --target convertlabs");
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

  const entities = [
    {
      entity: "Service Provider",
      listUrl: "https://convertlabs.io/booking/service-providers",
      newButton: "New Service Provider",
      newUrl: "https://convertlabs.io/booking/service-providers/new",
      phase: "phase-08-team",
    },
    {
      entity: "Quote",
      listUrl: "https://convertlabs.io/booking/quotes",
      newButton: "New Quote",
      newUrl: "https://convertlabs.io/booking/quotes/new-quote",
      phase: "phase-05-bookings",
    },
    {
      entity: "Invoice",
      listUrl: "https://convertlabs.io/booking/invoices",
      newButton: "New Invoice",
      newUrl: "https://convertlabs.io/booking/invoices/new-invoice",
      phase: "phase-09-payments",
    },
  ];

  for (const e of entities) {
    await captureCreateFlow(target, page, manifestById, e);

    // Also try alternate new URLs if form empty
    const altUrls = [
      e.newUrl,
      e.listUrl.replace(/\/$/, "") + "/new",
      e.listUrl.replace(/\/$/, "") + "/create",
    ].filter(Boolean) as string[];

    for (const url of altUrls) {
      if (url === e.newUrl) continue;
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
        await page.waitForTimeout(2000);
        const is404 = await page.getByText(/not found|404/i).isVisible().catch(() => false);
        if (!is404 && page.url().includes("new")) {
          await captureInline(target, page, manifestById, {
            id: `app-entity-${slugify(e.entity)}-new-alt-${slugify(url.split("/").pop() ?? "page")}`,
            phase: e.phase,
            url: page.url(),
            role: "owner",
            source: "app",
            label: `${e.entity} — alt new URL`,
            waitMs: 2000,
          });
        }
      } catch {
        // skip
      }
    }

    await captureListRowActions(target, page, manifestById, e);
    await sleep(1500);
  }

  await context.close();
  await browser.close();

  manifest.generatedAt = new Date().toISOString();
  manifest.pages = Array.from(manifestById.values()).sort((a, b) =>
    a.pageId.localeCompare(b.pageId),
  );
  writeFileSync(manifestPath(target), JSON.stringify(manifest, null, 2), "utf8");

  const entityCaptures = manifest.pages.filter((p) => p.pageId.startsWith("app-entity"));
  console.log(`\n=== Done ===`);
  console.log(`Entity captures this run: ${entityCaptures.length}`);
  console.log(`Total manifest: ${manifest.pages.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
