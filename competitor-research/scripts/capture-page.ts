#!/usr/bin/env tsx
/**
 * Capture a single page — debug or one-off.
 * npm run research:page -- --target convertlabs --id marketing-home
 * npm run research:page -- --target convertlabs --url https://convertlabs.io/pricing --role public
 */
import { capturePage } from "./capture-page-lib";
import { loadRegistry, parseArgs, requireArg } from "./utils";
import type { RegistryPage } from "./types";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const target = requireArg(args, "target");
  const force = Boolean(args.force);
  const headless = !args.headed;

  let page: RegistryPage;

  if (typeof args.id === "string") {
    const registry = loadRegistry(target);
    const found = registry.pages.find((p) => p.id === args.id);
    if (!found) {
      throw new Error(`Page id not found in registry: ${args.id}`);
    }
    page = found;
  } else if (typeof args.url === "string") {
    page = {
      id: (typeof args.id === "string" ? args.id : `manual-${Date.now()}`) as string,
      phase: typeof args.phase === "string" ? args.phase : "manual",
      url: args.url,
      role: (typeof args.role === "string" ? args.role : "public") as RegistryPage["role"],
      label: typeof args.label === "string" ? args.label : args.url,
    };
  } else {
    throw new Error("Provide --id <registry-page-id> or --url <url>");
  }

  console.log(`Capturing ${page.id} → ${page.url}`);
  const result = await capturePage({ target, page, headless, force });

  if (result.status === "ok") {
    console.log(`OK: ${result.jsonPath}`);
    console.log(`Screenshot: ${result.screenshotPath}`);
  } else if (result.status === "skipped") {
    console.log(`Skipped (already captured). Use --force to recapture.`);
  } else {
    console.error(`Error: ${result.error}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
