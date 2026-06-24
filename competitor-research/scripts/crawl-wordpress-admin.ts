#!/usr/bin/env tsx
/**
 * WordPress admin capture for ConvertLabs provisioned site.
 * Credentials in targets/<target>/.wordpress.local.json (gitignored)
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import { captureCurrentPage } from "./capture-inline";
import { targetDir } from "./paths";
import { parseArgs, requireArg } from "./utils";
import type { RegistryPage } from "./types";

interface WpConfig {
  loginUrl: string;
  username: string;
  password: string;
  siteUrl?: string;
}

async function snap(target: string, page: import("playwright").Page, id: string, label: string) {
  const meta: RegistryPage = {
    id,
    phase: "phase-11-website",
    url: page.url(),
    role: "owner",
    source: "wordpress-admin",
    label,
    waitMs: 4000,
  };
  const paths = await captureCurrentPage(target, page, meta);
  const dataDir = join(targetDir(target), "data", "website-builder");
  const shotDir = join(targetDir(target), "screenshots", "website-builder");
  mkdirSync(dataDir, { recursive: true });
  mkdirSync(shotDir, { recursive: true });
  writeFileSync(join(dataDir, `${id}.json`), readFileSync(paths.jsonPath, "utf8"));
  copyFileSync(paths.screenshotPath, join(shotDir, `${id}.png`));
  console.log(`  ✓ ${label} → ${page.url()}`);
}

async function main() {
  const target = requireArg(parseArgs(process.argv.slice(2)), "target");
  const cfgPath = join(targetDir(target), ".wordpress.local.json");
  if (!existsSync(cfgPath)) throw new Error(`Missing ${cfgPath}`);
  const cfg = JSON.parse(readFileSync(cfgPath, "utf8")) as WpConfig;

  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();

  console.log("\n=== WordPress login ===");
  await page.goto(cfg.loginUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.waitForTimeout(8000);
  await snap(target, page, "website-wp-login-form", "WP login page");

  // Cloudflare may block — try form login if visible
  const userField = page.locator("#user_login, input[name='log']").first();
  if (await userField.isVisible({ timeout: 8000 }).catch(() => false)) {
    await userField.fill(cfg.username);
    await page.locator("#user_pass, input[name='pwd']").first().fill(cfg.password);
    await page.locator("#wp-submit, input[type='submit']").first().click();
    await page.waitForTimeout(8000);
    await snap(target, page, "website-wp-admin-dashboard", "WP admin dashboard");
  } else {
    console.log("  Login form not visible (Cloudflare?) — trying direct admin URL");
    await page.goto(`${cfg.siteUrl ?? "https://freshhome.convertlabs.website"}/wp-admin/`, {
      waitUntil: "networkidle",
      timeout: 120_000,
    });
    await page.waitForTimeout(5000);
    if (await userField.isVisible({ timeout: 5000 }).catch(() => false)) {
      await userField.fill(cfg.username);
      await page.locator("#user_pass").fill(cfg.password);
      await page.locator("#wp-submit").click();
      await page.waitForTimeout(8000);
    }
    await snap(target, page, "website-wp-admin-after-login", "WP admin after login attempt");
  }

  const url = page.url();
  if (url.includes("wp-admin")) {
    for (const path of ["/wp-admin/", "/wp-admin/edit.php?post_type=page", "/wp-admin/admin.php?page=elementor"]) {
      await page.goto(`${cfg.siteUrl ?? "https://freshhome.convertlabs.website"}${path.replace(cfg.siteUrl ?? "", "")}`, {
        waitUntil: "networkidle",
        timeout: 60000,
      }).catch(() => page.goto(`${new URL(cfg.loginUrl).origin}${path}`, { waitUntil: "networkidle" }));
      await page.waitForTimeout(4000);
      const slug = path.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
      await snap(target, page, `website-wp-${slug}`, `WP admin: ${path}`);
    }
  }

  await browser.close();
  console.log("\nDone.");
}

main();
