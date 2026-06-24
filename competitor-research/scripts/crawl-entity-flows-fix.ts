#!/usr/bin/env tsx
/**
 * Re-capture New entity modals/drawers + clean row More menus only.
 * npm run research:crawl-entities-fix -- --target convertlabs
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { chromium, type Page } from "playwright";
import { captureCurrentPage } from "./capture-inline";
import { manifestPath, roleStoragePath } from "./paths";
import { parseArgs, requireArg, slugify } from "./utils";
import type { CaptureManifest, RegistryPage } from "./types";

const ROW_ACTION_PATTERNS: Record<string, RegExp> = {
  "Service Provider": /portal login|edit work schedule|edit wage/i,
  Quote: /duplicate|accept|send quote|calendar/i,
  Invoice: /open invoice|duplicate invoice|mark.*paid|resend/i,
};

async function clickNewButton(page: Page, label: string): Promise<boolean> {
  return page.evaluate((btnLabel) => {
    const btn = [...document.querySelectorAll("button")].find((b) =>
      (b.textContent ?? "").includes(btnLabel),
    );
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  }, label);
}

async function discoverDrawerTabs(page: Page): Promise<string[]> {
  return (await page.evaluate(`(() => {
    const norm = (s) => (s || "").replace(/\\s+/g, " ").trim();
    const dialog = document.querySelector(".el-dialog, [role='dialog']");
    if (!dialog) return [];
    const seen = new Set();
    const tabs = [];
    dialog.querySelectorAll("[role='tab']").forEach((el) => {
      const text = norm(el.textContent);
      if (text && !seen.has(text)) {
        seen.add(text);
        tabs.push(text);
      }
    });
    return tabs;
  })()`)) as string[];
}

async function clickDrawerTab(page: Page, tab: string): Promise<boolean> {
  const dialog = page.locator(".el-dialog, [role='dialog']").first();
  try {
    const tabEl = dialog.getByRole("tab", { name: tab, exact: true });
    if (await tabEl.isVisible({ timeout: 2000 })) {
      await tabEl.click();
      await page.waitForTimeout(1500);
      return true;
    }
  } catch {
    // fall through
  }
  return false;
}

async function openRowMoreMenu(page: Page): Promise<boolean> {
  return page.evaluate(`(() => {
    const row = document.querySelector("table tbody tr");
    if (!row) return false;
    const lastCell = row.querySelector("td:last-child");
    if (!lastCell) return false;
    const dropdown = lastCell.querySelector(".el-dropdown, .el-dropdown-selfdefine, button");
    const buttons = lastCell.querySelectorAll("button");
    const target = lastCell.querySelector(".el-dropdown") || buttons[buttons.length - 1];
    if (target) {
      target.click();
      return true;
    }
    return false;
  })()`);
}

async function getRowDropdownItems(page: Page): Promise<string[]> {
  return (await page.evaluate(`(() => {
    const norm = (s) => (s || "").replace(/\\s+/g, " ").trim();
    const items = [];
    const seen = new Set();
    document.querySelectorAll(".el-dropdown-menu:last-of-type .el-dropdown-menu__item").forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0) return;
      const text = norm(el.textContent);
      if (text && text.length < 120 && !seen.has(text)) {
        seen.add(text);
        items.push(text);
      }
    });
    return items;
  })()`)) as string[];
}

async function capture(
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const target = requireArg(args, "target");
  const storagePath = roleStoragePath(target, "owner");

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

  // ── New form drawers ───────────────────────────────────────────────
  const newForms = [
    {
      entity: "Service Provider",
      listUrl: "https://convertlabs.io/booking/service-providers",
      button: "New Service Provider",
      phase: "phase-08-team",
    },
    {
      entity: "Invoice",
      listUrl: "https://convertlabs.io/booking/invoices",
      button: "New Invoice",
      phase: "phase-09-payments",
    },
  ];

  for (const f of newForms) {
    console.log(`\n=== ${f.entity} — New drawer ===`);
    await page.goto(f.listUrl, { waitUntil: "networkidle", timeout: 60_000 });
    await page.waitForTimeout(2000);
    await clickNewButton(page, f.button);
    await page.waitForTimeout(2500);

    await capture(target, page, manifestById, {
      id: `app-entity-${slugify(f.entity)}-new-drawer`,
      phase: f.phase,
      url: f.listUrl,
      role: "owner",
      source: "app",
      label: `${f.entity} — New drawer form`,
      waitMs: 1500,
    });

    const tabs = await discoverDrawerTabs(page);
    for (const tab of tabs) {
      if (await clickDrawerTab(page, tab)) {
        await capture(target, page, manifestById, {
          id: `app-entity-${slugify(f.entity)}-new-drawer-tab-${slugify(tab)}`,
          phase: f.phase,
          url: f.listUrl,
          role: "owner",
          source: "app",
          label: `${f.entity} — New drawer tab: ${tab}`,
          waitMs: 1500,
        });
      }
    }
    await page.keyboard.press("Escape");
  }

  // Quote new form page (full page, not drawer)
  console.log("\n=== Quote — New form page ===");
  await page.goto("https://convertlabs.io/booking/quotes/new-quote", {
    waitUntil: "networkidle",
    timeout: 60_000,
  });
  await page.waitForTimeout(2000);
  await capture(target, page, manifestById, {
    id: "app-entity-quote-new-form-page",
    phase: "phase-05-bookings",
    url: page.url(),
    role: "owner",
    source: "app",
    label: "Quote — New form page",
    waitMs: 2000,
  });

  // ── Row More menus (filtered) ──────────────────────────────────────
  const lists = [
    {
      entity: "Service Provider",
      url: "https://convertlabs.io/booking/service-providers",
      phase: "phase-08-team",
    },
    { entity: "Quote", url: "https://convertlabs.io/booking/quotes", phase: "phase-05-bookings" },
    { entity: "Invoice", url: "https://convertlabs.io/booking/invoices", phase: "phase-09-payments" },
  ];

  for (const l of lists) {
    console.log(`\n=== ${l.entity} — More menu (clean) ===`);
    await page.goto(l.url, { waitUntil: "networkidle", timeout: 60_000 });
    await page.waitForTimeout(2500);

    await openRowMoreMenu(page);
    await page.waitForTimeout(1000);

    const allItems = await getRowDropdownItems(page);
    const pattern = ROW_ACTION_PATTERNS[l.entity];
    const rowItems = allItems.filter((i) => pattern.test(i));
    console.log(`  Row actions: ${rowItems.join(" | ")}`);

    await capture(target, page, manifestById, {
      id: `app-entity-${slugify(l.entity)}-row-more-menu-clean`,
      phase: l.phase,
      url: l.url,
      role: "owner",
      source: "app",
      label: `${l.entity} — More menu (row actions)`,
      waitMs: 800,
    });

    for (const item of rowItems) {
      await page.goto(l.url, { waitUntil: "networkidle", timeout: 60_000 });
      await page.waitForTimeout(2000);
      await openRowMoreMenu(page);
      await page.waitForTimeout(800);

      const loc = page
        .locator(".el-dropdown-menu__item")
        .filter({ hasText: item })
        .last();
      if (await loc.isVisible({ timeout: 2000 })) {
        await loc.click();
        await page.waitForTimeout(2500);
        await capture(target, page, manifestById, {
          id: `app-entity-${slugify(l.entity)}-action-${slugify(item)}`,
          phase: l.phase,
          url: page.url(),
          role: "owner",
          source: "app",
          label: `${l.entity} — ${item}`,
          waitMs: 2000,
        });
        await page.keyboard.press("Escape").catch(() => {});
      }
    }
  }

  await context.close();
  await browser.close();

  manifest.generatedAt = new Date().toISOString();
  manifest.pages = Array.from(manifestById.values()).sort((a, b) =>
    a.pageId.localeCompare(b.pageId),
  );
  writeFileSync(manifestPath(target), JSON.stringify(manifest, null, 2), "utf8");
  console.log(`\nDone. Total manifest: ${manifest.pages.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
