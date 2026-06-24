#!/usr/bin/env tsx
/**
 * Batch capture from page-registry.json
 * npm run research:crawl -- --target convertlabs
 * npm run research:crawl -- --target convertlabs --phase phase-01-public
 * npm run research:crawl -- --target convertlabs --role owner --force
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { capturePage } from "./capture-page-lib";
import { ensureTargetDirs, manifestPath } from "./paths";
import { loadRegistry, parseArgs, requireArg, sleep } from "./utils";
import type { CaptureManifest } from "./types";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const target = requireArg(args, "target");
  const force = Boolean(args.force);
  const headless = !args.headed;
  const phaseFilter = typeof args.phase === "string" ? args.phase : undefined;
  const roleFilter = typeof args.role === "string" ? args.role : undefined;
  const idFilter = typeof args.id === "string" ? args.id : undefined;

  const registry = loadRegistry(target);
  ensureTargetDirs(target);

  let pages = registry.pages;
  if (phaseFilter) pages = pages.filter((p) => p.phase === phaseFilter);
  if (roleFilter) pages = pages.filter((p) => p.role === roleFilter);
  if (idFilter) pages = pages.filter((p) => p.id === idFilter);

  if (pages.length === 0) {
    console.log("No pages matched filters.");
    return;
  }

  console.log(
    `Crawling ${pages.length} page(s) for ${registry.displayName} (delay ${registry.crawlDelayMs}ms)`,
  );

  const manifest: CaptureManifest = existsSync(manifestPath(target))
    ? (JSON.parse(readFileSync(manifestPath(target), "utf8")) as CaptureManifest)
    : { target, generatedAt: new Date().toISOString(), pages: [] };

  const manifestById = new Map(manifest.pages.map((p) => [p.pageId, p]));

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    console.log(`[${i + 1}/${pages.length}] ${page.id}`);

    const result = await capturePage({ target, page, headless, force });

    manifestById.set(page.id, {
      pageId: page.id,
      phase: page.phase,
      role: page.role,
      url: page.url,
      capturedAt: new Date().toISOString(),
      jsonPath: result.jsonPath ?? "",
      screenshotPath: result.screenshotPath ?? "",
      status: result.status,
      error: result.error,
    });

    if (result.status === "error") {
      console.error(`  ERROR: ${result.error}`);
    } else if (result.status === "skipped") {
      console.log(`  skipped (use --force to recapture)`);
    } else {
      console.log(`  ok`);
    }

    if (i < pages.length - 1) {
      await sleep(registry.crawlDelayMs);
    }
  }

  manifest.generatedAt = new Date().toISOString();
  manifest.pages = Array.from(manifestById.values()).sort((a, b) =>
    a.pageId.localeCompare(b.pageId),
  );

  writeFileSync(manifestPath(target), JSON.stringify(manifest, null, 2), "utf8");
  console.log(`\nManifest: ${manifestPath(target)}`);

  const errors = manifest.pages.filter((p) => p.status === "error").length;
  const ok = manifest.pages.filter((p) => p.status === "ok").length;
  console.log(`Done. ok=${ok} errors=${errors} total=${manifest.pages.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
