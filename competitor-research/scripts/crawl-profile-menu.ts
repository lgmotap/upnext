#!/usr/bin/env tsx
/**
 * Capture user profile dropdown pages (top-right menu).
 * npm run research:crawl-profile -- --target convertlabs
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { captureCurrentPage } from "./capture-inline";
import { capturePage } from "./capture-page-lib";
import { manifestPath, roleStoragePath } from "./paths";
import { parseArgs, requireArg, slugify, sleep } from "./utils";
import type { CaptureManifest, RegistryPage } from "./types";

const PROFILE_PAGES: Array<{ label: string; url: string }> = [
  { label: "Company", url: "https://convertlabs.io/company" },
  { label: "Accounts", url: "https://convertlabs.io/accounts" },
  { label: "API Keys", url: "https://convertlabs.io/api-keys" },
  { label: "Billing", url: "https://convertlabs.io/billing" },
  { label: "Perks", url: "https://convertlabs.io/perks" },
  { label: "Community", url: "https://convertlabs.io/community" },
];

async function openProfileDropdown(page: import("playwright").Page): Promise<string[]> {
  await page.goto("https://convertlabs.io/dashboard", {
    waitUntil: "networkidle",
    timeout: 60_000,
  });
  await page.waitForTimeout(2000);

  await page.evaluate(`(() => {
    const trigger =
      document.querySelector(".el-dropdown-selfdefine") ||
      document.querySelector(".el-icon-arrow-down")?.closest("[class*='dropdown']") ||
      document.querySelector(".el-icon-arrow-down");
    if (trigger) trigger.click();
  })()`);
  await page.waitForTimeout(1500);

  return (await page.evaluate(`(() => {
    const norm = (s) => (s || "").replace(/\\s+/g, " ").trim();
    return [...document.querySelectorAll(".el-dropdown-menu__item, .el-dropdown-menu li")].map(
      (el) => norm(el.textContent),
    ).filter(Boolean);
  })()`)) as string[];
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
  console.log(`  ✓ ${meta.label} → ${meta.url}`);
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

  console.log("\n=== Profile dropdown (menu open) ===\n");
  const menuItems = await openProfileDropdown(page);
  console.log(`Items in dropdown: ${menuItems.join(", ")}`);

  await capture(target, page, manifestById, {
    id: "app-profile-menu-open",
    phase: "phase-09-payments",
    url: page.url(),
    role: "owner",
    source: "app",
    label: "Profile menu — dropdown open (Log Out visible)",
    waitMs: 1000,
  });

  const hasLogout = menuItems.some((i) => /log\s*out/i.test(i));
  console.log(hasLogout ? "  ✓ Log Out present in menu (not clicked)" : "  ⚠ Log Out not found in menu");

  await context.close();
  await browser.close();

  console.log("\n=== Profile pages (direct routes) ===\n");

  for (const { label, url } of PROFILE_PAGES) {
    const id = `app-profile-${slugify(label)}`;
    console.log(`→ ${label}`);

    const meta: RegistryPage = {
      id,
      phase: label === "Billing" ? "phase-09-payments" : "phase-04-owner-nav",
      url,
      role: "owner",
      source: "app",
      label: `Profile — ${label}`,
      waitMs: 3000,
    };

    const result = await capturePage({ target, page: meta, headless: true, force });
    if (result.status === "ok") {
      manifestById.set(id, {
        pageId: id,
        phase: meta.phase,
        role: meta.role,
        url,
        capturedAt: new Date().toISOString(),
        jsonPath: result.jsonPath ?? "",
        screenshotPath: result.screenshotPath ?? "",
        status: "ok",
      });
      console.log(`  ✓ captured`);
    } else {
      console.log(`  ERROR: ${result.error ?? result.status}`);
    }
    await sleep(1500);
  }

  manifest.generatedAt = new Date().toISOString();
  manifest.pages = Array.from(manifestById.values()).sort((a, b) =>
    a.pageId.localeCompare(b.pageId),
  );
  writeFileSync(manifestPath(target), JSON.stringify(manifest, null, 2), "utf8");

  console.log("\n=== Profile menu checklist ===");
  for (const { label } of PROFILE_PAGES) {
    const id = `app-profile-${slugify(label)}`;
    const ok = manifestById.has(id);
    console.log(`  [${ok ? "x" : " "}] ${label}`);
  }
  console.log(`  [x] Log Out — in dropdown screenshot (app-profile-menu-open)`);
  console.log(`\nTotal manifest pages: ${manifest.pages.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
