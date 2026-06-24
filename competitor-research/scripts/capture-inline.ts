import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { Page } from "playwright";
import {
  EXTRACT_PAGE_STRUCTURE_SCRIPT,
  type ExtractedDom,
} from "./extract-page-structure";
import { pageJsonPath, pageScreenshotPath } from "./paths";
import type { PageCapture, RegistryPage } from "./types";

export async function captureCurrentPage(
  target: string,
  pwPage: Page,
  meta: RegistryPage,
): Promise<{ jsonPath: string; screenshotPath: string }> {
  const jsonPath = pageJsonPath(target, meta.id);
  const screenshotPath = pageScreenshotPath(target, meta.id);
  const viewport = { width: 1440, height: 900 };

  await pwPage.waitForTimeout(meta.waitMs ?? 2000);

  const extracted = (await pwPage.evaluate(
    EXTRACT_PAGE_STRUCTURE_SCRIPT,
  )) as ExtractedDom;

  const capture: PageCapture = {
    pageId: meta.id,
    url: meta.url,
    finalUrl: pwPage.url(),
    role: meta.role,
    phase: meta.phase,
    label: meta.label ?? meta.id,
    capturedAt: new Date().toISOString(),
    viewport,
    errors: [],
    ...extracted,
  };

  mkdirSync(dirname(jsonPath), { recursive: true });
  mkdirSync(dirname(screenshotPath), { recursive: true });
  writeFileSync(jsonPath, JSON.stringify(capture, null, 2), "utf8");
  await pwPage.screenshot({ path: screenshotPath, fullPage: true });

  return { jsonPath, screenshotPath };
}
