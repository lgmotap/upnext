#!/usr/bin/env tsx
/**
 * Bootstrap local research target from template (gitignored output).
 * npx tsx competitor-research/scripts/init-target.ts --target convertlabs
 */
import { existsSync, cpSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { RESEARCH_ROOT, targetDir } from "./paths";
import { parseArgs, requireArg } from "./utils";

const DISCOVERY_NOTES = `# Discovery notes — ConvertLabs

> Local only. Record observations automation cannot capture.

## Trial account

- Email:
- Plan tier:
- Subdomain:
- Created:

## Nav tree (manual pass)

_Paste sidebar / top nav structure here after Phase 0 exploration._

## UX observations

- 
- 

## Business logic notes

- Status transitions:
- Permission surprises:
- Defaults they pre-fill:

## Mobile app (Phase 14)

_Screenshot paths under screenshots/mobile/_

## Open questions

- 

`;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const target = requireArg(args, "target");
  const dest = targetDir(target);

  if (existsSync(join(dest, "page-registry.json"))) {
    console.log(`Already exists: ${join(dest, "page-registry.json")}`);
    console.log("Delete manually to re-init.");
    return;
  }

  mkdirSync(join(dest, "screenshots"), { recursive: true });
  mkdirSync(join(dest, "data"), { recursive: true });
  mkdirSync(join(dest, "reports"), { recursive: true });
  mkdirSync(join(dest, "roles"), { recursive: true });

  const template = join(RESEARCH_ROOT, "templates", "page-registry.example.json");
  cpSync(template, join(dest, "page-registry.json"));
  writeFileSync(join(dest, "discovery-notes.md"), DISCOVERY_NOTES, "utf8");

  console.log(`Initialized: ${dest}`);
  console.log("\nNext steps:");
  console.log(`  npx playwright install chromium`);
  console.log(`  npm run research:crawl -- --target ${target} --phase phase-01-public`);
  console.log(`  npm run research:report -- --target ${target}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
