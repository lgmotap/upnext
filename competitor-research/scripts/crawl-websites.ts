#!/usr/bin/env tsx
/**
 * Crawl ConvertLabs website builder — theme, credentials, WP edit link, domain modal.
 * npm run research:crawl-websites -- --target convertlabs
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import { captureCurrentPage } from "./capture-inline";
import { roleStoragePath, targetDir } from "./paths";
import { parseArgs, requireArg, slugify } from "./utils";
import type { RegistryPage } from "./types";

function dirs(target: string) {
  const dataDir = join(targetDir(target), "data", "website-builder");
  const shotDir = join(targetDir(target), "screenshots", "website-builder");
  const reportDir = join(targetDir(target), "reports");
  mkdirSync(dataDir, { recursive: true });
  mkdirSync(shotDir, { recursive: true });
  mkdirSync(reportDir, { recursive: true });
  return { dataDir, shotDir, reportDir };
}

async function snap(target: string, page: Page, id: string, label: string, waitMs = 3000) {
  const meta: RegistryPage = {
    id,
    phase: "phase-11-website",
    url: page.url(),
    role: "owner",
    source: "website-builder",
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
    page.getByRole("button", { name: pat }).first(),
    page.getByRole("link", { name: pat }).first(),
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

async function extractPageLinks(page: Page): Promise<string[]> {
  return (await page.evaluate(`(() => {
    const out = [];
    document.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href") || "";
      const text = (a.textContent || "").replace(/\\s+/g, " ").trim();
      if (href) out.push(text + " → " + href);
    });
    return out.slice(0, 80);
  })()`)) as string[];
}

async function extractVisibleCredentials(page: Page): Promise<Record<string, string>> {
  return (await page.evaluate(`(() => {
    const body = document.body.innerText || "";
    const urlMatch = body.match(/https?:\\/\\/[^\\s]+convertlabs\\.website[^\\s]*/i);
    const wpMatch = body.match(/https?:\\/\\/[^\\s]+wp-login[^\\s]*/i);
    return {
      bodySample: body.replace(/\\s+/g, " ").slice(0, 2500),
      siteUrl: urlMatch ? urlMatch[0] : "",
      wpLoginUrl: wpMatch ? wpMatch[0] : "",
    };
  })()`)) as Record<string, string>;
}

async function openDomainModal(page: Page): Promise<boolean> {
  const triggers = [
    /connect.*domain/i,
    /external domain/i,
    /custom domain/i,
    /use your own domain/i,
    /add domain/i,
    /domain/i,
  ];
  for (const pat of triggers) {
    const btn = page.getByRole("button", { name: pat }).first();
    if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(2500);
      return true;
    }
    const link = page.getByRole("link", { name: pat }).first();
    if (await link.isVisible({ timeout: 1500 }).catch(() => false)) {
      await link.click();
      await page.waitForTimeout(2500);
      return true;
    }
  }
  return false;
}

async function main() {
  const target = requireArg(parseArgs(process.argv.slice(2)), "target");
  const storagePath = roleStoragePath(target, "owner");
  if (!existsSync(storagePath)) throw new Error("No owner session — run research:login");

  const findings: string[] = [];
  const browser = await chromium.launch({ headless: true });
  const page = await (
    await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: storagePath })
  ).newPage();

  const websiteUrls = [
    "https://convertlabs.io/websites/",
    "https://convertlabs.io/websites/theme-selection",
    "https://convertlabs.io/domains/",
    "https://convertlabs.io/domains/domain-selection",
  ];

  console.log("\n=== Website builder — entry routes ===");
  for (const url of websiteUrls) {
    await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 }).catch(() => {});
    await page.waitForTimeout(3000);
    const slug = slugify(new URL(url).pathname || "root");
    await snap(target, page, `website-route-${slug}`, `Route: ${url}`);
  }

  // Main websites hub (post-theme state)
  console.log("\n=== Websites hub (authenticated) ===");
  await page.goto("https://convertlabs.io/websites/", { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(4000);
  await snap(target, page, "website-hub-main", "Websites hub — main");

  const creds = await extractVisibleCredentials(page);
  if (creds.siteUrl) findings.push(`Site URL on page: ${creds.siteUrl}`);
  if (creds.wpLoginUrl) findings.push(`WP login on page: ${creds.wpLoginUrl}`);

  // Look for edit website / view site / credentials section
  console.log("\n=== Credentials & edit links ===");
  const links = await extractPageLinks(page);
  const relevant = links.filter(
    (l) =>
      /convertlabs\.website|wp-login|edit|view site|password|domain|wordpress/i.test(l),
  );
  console.log(relevant.join("\n") || "(no obvious links in DOM)");

  for (const label of [/edit website/i, /edit site/i, /view website/i, /view site/i, /visit site/i, /open website/i]) {
    const before = page.url();
    if (await safeClick(page, label)) {
      await snap(target, page, `website-after-${slugify(label.source)}`, `After click: ${label.source}`);
      if (page.url() !== before) {
        findings.push(`Click ${label.source} → ${page.url()}`);
      }
      await page.goto("https://convertlabs.io/websites/", { waitUntil: "networkidle" }).catch(() => {});
      await page.waitForTimeout(2000);
    }
  }

  // Re-snap hub for credential panel (copy buttons, password fields)
  await page.goto("https://convertlabs.io/websites/", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  await snap(target, page, "website-hub-credentials", "Websites — credentials panel");

  // External domain modal
  console.log("\n=== External domain modal ===");
  if (await openDomainModal(page)) {
    await snap(target, page, "website-domain-modal", "Connect external domain modal");
    // Also try domains route modal
  } else {
    await page.goto("https://convertlabs.io/domains/", { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);
    await snap(target, page, "website-domains-page", "Domains page");
    await openDomainModal(page);
    await snap(target, page, "website-domain-modal", "Connect external domain modal (from domains)");
  }

  // DNS details — scroll modal if present
  await page.evaluate(`(() => {
    const modal = document.querySelector("[role='dialog'], .el-dialog, .modal");
    if (modal) modal.scrollTop = modal.scrollHeight;
  })()`);
  await page.waitForTimeout(1000);
  await snap(target, page, "website-domain-modal-dns", "Domain modal — DNS details scrolled");

  // Published site (public)
  console.log("\n=== Published WordPress site ===");
  const publishedUrl = creds.siteUrl?.replace(/[.,]$/, "") || "https://freshhome.convertlabs.website";
  await page.goto(publishedUrl, { waitUntil: "networkidle", timeout: 60_000 }).catch(() => {});
  await page.waitForTimeout(4000);
  await snap(target, page, "website-published-home", `Published site home: ${publishedUrl}`);

  // Booking on published site — look for book CTA
  for (const pat of [/book now/i, /book/i, /schedule/i, /get a quote/i]) {
    if (await safeClick(page, pat)) {
      await snap(target, page, "website-published-booking-cta", `Published site — ${pat.source}`);
      break;
    }
  }

  // WP admin login page (no token — capture login form structure only unless link on hub)
  await page.goto("https://convertlabs.io/websites/", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  const wpLink = await page.locator("a[href*='wp-login'], a[href*='one_time_login']").first();
  if (await wpLink.isVisible({ timeout: 3000 }).catch(() => false)) {
    const href = await wpLink.getAttribute("href");
    findings.push(`WP one-time login link found: ${href?.slice(0, 80)}...`);
    console.log("\n=== WordPress one-time login (edit link) ===");
    await wpLink.click();
    await page.waitForTimeout(5000);
    await snap(target, page, "website-wp-login-redirect", "WordPress login / redirect after edit link");
    // If lands in wp-admin
    if (page.url().includes("wp-admin") || page.url().includes("convertlabs.website")) {
      await snap(target, page, "website-wp-admin-landing", "WordPress admin landing");
    }
  } else {
    console.log("  No wp-login link visible on hub — may need manual token URL");
    findings.push("WP edit link not auto-discovered on /websites/ — user provided freshhome.convertlabs.website pattern");
  }

  await browser.close();

  const { reportDir } = dirs(target);
  const report = [
    "# Website builder capture",
    "",
    `Captured: ${new Date().toISOString()}`,
    "",
    "## Architecture (from user + crawl)",
    "",
    "1. Owner activates website in ConvertLabs → selects theme at `/websites/theme-selection`",
    "2. After activation, `/websites/` shows: **site URL**, **password**, **Edit website** link",
    "3. Edit link → WordPress one-time login: `{subdomain}.convertlabs.website/.../wp-login.php?user_id=1&one_time_login_token=...`",
    "4. External domain modal shows DNS records to point custom domain",
    "",
    "## Findings from this crawl",
    "",
    ...findings.map((f) => `- ${f}`),
    "",
    "## Captures",
    "",
    "See `screenshots/website-builder/` and `data/website-builder/`",
    "",
    "## Distinction vs standalone booking form",
    "",
    "| Surface | URL |",
    "|---------|-----|",
    "| Standalone embed | `convertlabs.io/booking_form/{id}` |",
    "| Website builder site | `{business}.convertlabs.website` (WordPress) |",
  ].join("\n");

  writeFileSync(join(reportDir, "website-builder.md"), report, "utf8");
  console.log(`\n=== Done ===\nReport: ${join(reportDir, "website-builder.md")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
