import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import {
  EXTRACT_PAGE_STRUCTURE_SCRIPT,
  type ExtractedDom,
} from "./extract-page-structure";
import {
  ensureTargetDirs,
  pageJsonPath,
  pageScreenshotPath,
  roleStoragePath,
} from "./paths";
import type { PageCapture, RegistryPage, ResearchRole } from "./types";

export interface CapturePageOptions {
  target: string;
  page: RegistryPage;
  headless?: boolean;
  force?: boolean;
  storageStateRole?: ResearchRole;
}

export interface CapturePageResult {
  status: "ok" | "skipped" | "error";
  error?: string;
  jsonPath?: string;
  screenshotPath?: string;
}

async function createContext(
  browser: Browser,
  target: string,
  role: ResearchRole,
  viewport: { width: number; height: number },
): Promise<BrowserContext> {
  const storagePath = roleStoragePath(target, role);
  const hasStorage = role !== "public" && existsSync(storagePath);

  return browser.newContext({
    viewport,
    storageState: hasStorage ? storagePath : undefined,
    userAgent:
      viewport.width < 500
        ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        : undefined,
  });
}

export async function capturePage(
  options: CapturePageOptions,
): Promise<CapturePageResult> {
  const { target, page, headless = true, force = false } = options;
  const jsonPath = pageJsonPath(target, page.id);
  const screenshotPath = pageScreenshotPath(target, page.id);

  if (!force && existsSync(jsonPath) && existsSync(screenshotPath)) {
    return { status: "skipped", jsonPath, screenshotPath };
  }

  ensureTargetDirs(target);

  const viewport =
    page.viewport === "mobile"
      ? { width: 390, height: 844 }
      : { width: 1440, height: 900 };

  const browser = await chromium.launch({ headless });
  const errors: string[] = [];

  try {
    const context = await createContext(
      browser,
      target,
      page.role,
      viewport,
    );
    const pwPage = await context.newPage();

    await pwPage.goto(page.url, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    if (page.waitForSelector) {
      await pwPage
        .waitForSelector(page.waitForSelector, { timeout: 15_000 })
        .catch((err) => {
          errors.push(`waitForSelector: ${String(err)}`);
        });
    }

    if (page.waitMs) {
      await pwPage.waitForTimeout(page.waitMs);
    } else {
      await pwPage.waitForTimeout(1500);
    }

    const extracted = (await pwPage.evaluate(
      EXTRACT_PAGE_STRUCTURE_SCRIPT,
    )) as ExtractedDom;

    const capture: PageCapture = {
      pageId: page.id,
      url: page.url,
      finalUrl: pwPage.url(),
      role: page.role,
      phase: page.phase,
      label: page.label ?? page.id,
      capturedAt: new Date().toISOString(),
      viewport,
      errors,
      ...extracted,
    };

    mkdirSync(dirname(jsonPath), { recursive: true });
    mkdirSync(dirname(screenshotPath), { recursive: true });

    writeFileSync(jsonPath, JSON.stringify(capture, null, 2), "utf8");
    await pwPage.screenshot({ path: screenshotPath, fullPage: true });

    await context.close();
    return { status: "ok", jsonPath, screenshotPath };
  } catch (err) {
    return { status: "error", error: String(err) };
  } finally {
    await browser.close();
  }
}

export async function withBrowser<T>(
  headless: boolean,
  fn: (browser: Browser) => Promise<T>,
): Promise<T> {
  const browser = await chromium.launch({ headless });
  try {
    return await fn(browser);
  } finally {
    await browser.close();
  }
}

export async function openPage(
  browser: Browser,
  target: string,
  role: ResearchRole,
  viewport = { width: 1440, height: 900 },
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await createContext(browser, target, role, viewport);
  const page = await context.newPage();
  return { context, page };
}
