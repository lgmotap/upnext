#!/usr/bin/env tsx
/**
 * Crawl standalone public booking form (embed URL, not website-builder page).
 * npm run research:crawl-public-booking -- --target convertlabs
 *
 * Default URL: https://convertlabs.io/booking_form/4221
 * Override: --url https://convertlabs.io/booking_form/4221
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import { captureCurrentPage } from "./capture-inline";
import { targetDir } from "./paths";
import { parseArgs, requireArg, slugify } from "./utils";
import type { RegistryPage } from "./types";

const DEFAULT_URL = "https://convertlabs.io/booking_form/4221";

interface StepRecord {
  step: number;
  id: string;
  label: string;
  url: string;
  headings: string[];
}

function publicBookingDir(target: string) {
  const dataDir = join(targetDir(target), "data", "public-booking");
  const shotDir = join(targetDir(target), "screenshots", "public-booking");
  mkdirSync(dataDir, { recursive: true });
  mkdirSync(shotDir, { recursive: true });
  return { dataDir, shotDir, reportDir: join(targetDir(target), "reports") };
}

async function snap(
  target: string,
  page: Page,
  id: string,
  label: string,
  phase = "phase-05-public-booking",
): Promise<{ headings: string[] }> {
  const meta: RegistryPage = {
    id,
    phase,
    url: page.url(),
    role: "public",
    source: "booking-form",
    label,
    waitMs: 3000,
  };
  const paths = await captureCurrentPage(target, page, meta);
  const { dataDir, shotDir } = publicBookingDir(target);
  const { readFileSync, copyFileSync } = await import("node:fs");
  writeFileSync(join(dataDir, `${id}.json`), readFileSync(paths.jsonPath, "utf8"));
  copyFileSync(paths.screenshotPath, join(shotDir, `${id}.png`));
  const json = JSON.parse(readFileSync(join(dataDir, `${id}.json`), "utf8")) as {
    headings?: Array<{ text: string }>;
  };
  const headings = (json.headings ?? []).map((h) => h.text);
  console.log(`  ✓ ${label}${headings.length ? ` — ${headings.join(" | ")}` : ""}`);
  return { headings };
}

async function discoverStepTitle(page: Page): Promise<string> {
  return (await page.evaluate(`(() => {
    const h = document.querySelector("h1, h2, h3, [class*='step-title'], [class*='section-title']");
    return (h?.textContent || "").replace(/\\s+/g, " ").trim();
  })()`)) as string;
}

async function clickNext(page: Page): Promise<boolean> {
  const patterns = [
    /continue/i,
    /next/i,
    /proceed/i,
    /book now/i,
    /confirm/i,
    /schedule/i,
    /submit/i,
  ];
  for (const pat of patterns) {
    const btn = page.getByRole("button", { name: pat }).first();
    if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(3500);
      return true;
    }
  }
  const link = page.getByRole("link", { name: /continue|next/i }).first();
  if (await link.isVisible({ timeout: 1000 }).catch(() => false)) {
    await link.click();
    await page.waitForTimeout(3500);
    return true;
  }
  return false;
}

async function fillMinimalFields(page: Page): Promise<void> {
  await page.getByLabel(/first name|name/i).first().fill("Research").catch(() => {});
  await page.getByLabel(/last name/i).first().fill("Test").catch(() => {});
  await page.getByLabel(/email/i).first().fill("research-test@example.com").catch(() => {});
  await page.getByLabel(/phone/i).first().fill("5555550100").catch(() => {});
  await page.locator("input[type='email']").first().fill("research-test@example.com").catch(() => {});
  await page.locator("input[type='tel']").first().fill("5555550100").catch(() => {});

  // Address
  await page.getByLabel(/address|street/i).first().fill("123 William St").catch(() => {});
  await page.getByLabel(/city/i).first().fill("New York").catch(() => {});
  await page.getByLabel(/zip|postal/i).first().fill("10038").catch(() => {});

  // Select first radio/checkbox if required
  const radio = page.locator("input[type='radio']:visible").first();
  if (await radio.isVisible({ timeout: 800 }).catch(() => false)) {
    await radio.check().catch(() => {});
  }

  // Pricing parameters — click first numeric option if present
  await page.locator("[class*='parameter'] button, [class*='counter'] button").first().click().catch(() => {});
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const target = requireArg(args, "target");
  const startUrl = (args.url as string) ?? DEFAULT_URL;
  const maxSteps = Number(args.maxSteps ?? 12);

  const steps: StepRecord[] = [];
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();

  console.log(`\n=== Standalone public booking form ===`);
  console.log(`URL: ${startUrl}`);
  console.log(`Note: This is the embed/direct form URL — not the website-builder page.\n`);

  await page.goto(startUrl, { waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForTimeout(4000);

  const landing = await snap(target, page, "public-booking-standalone-landing", "Standalone form — landing");
  steps.push({
    step: 1,
    id: "public-booking-standalone-landing",
    label: "Landing",
    url: page.url(),
    headings: landing.headings,
  });

  // Single-page scroll form — capture each section heading, not step clicks
  const sectionHeadings = landing.headings.length
    ? landing.headings
    : ["full-page"];
  for (let i = 0; i < sectionHeadings.length; i++) {
    const heading = sectionHeadings[i];
    const el = page.getByRole("heading", { name: heading, exact: true }).first();
    if (await el.isVisible({ timeout: 1500 }).catch(() => false)) {
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1200);
      const id = `public-booking-standalone-section-${slugify(heading)}`;
      const ui = await snap(target, page, id, `Section: ${heading}`);
      steps.push({ step: i + 2, id, label: heading, url: page.url(), headings: ui.headings });
    }
  }

  // Mobile viewport landing
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(startUrl, { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  await snap(target, page, "public-booking-standalone-mobile", "Standalone form — mobile");

  await browser.close();

  const { reportDir } = publicBookingDir(target);
  const report = [
    "# Public booking — standalone embed form",
    "",
    `**URL:** ${startUrl}`,
    "",
    "> This is ConvertLabs' **direct/embed booking form** (`/booking_form/{id}`), not the booking flow embedded in a website-builder page. The full marketing site uses a separate WordPress-connected theme picker (to be captured when you share the example site).",
    "",
    "## Steps captured",
    "",
    "| Step | Label | Capture ID | URL |",
    "|------|-------|------------|-----|",
    ...steps.map((s) => `| ${s.step} | ${s.label} | \`${s.id}\` | ${s.url} |`),
    "",
    "## Distinction vs website builder",
    "",
    "| Surface | URL pattern | Notes |",
    "|---------|-------------|-------|",
    "| Standalone embed | `/booking_form/{id}` | iframe/widget link from Getting Started; same form engine |",
    "| Website builder site | `{business}.convertlabs.website` or custom domain | WordPress theme connection; form embedded in page layout |",
    "",
    "Captures: `data/public-booking/`, `screenshots/public-booking/`",
  ].join("\n");

  writeFileSync(join(reportDir, "public-booking-standalone.md"), report, "utf8");
  console.log(`\n=== Done ===`);
  console.log(`Steps: ${steps.length}`);
  console.log(`Report: ${join(reportDir, "public-booking-standalone.md")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
