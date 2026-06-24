#!/usr/bin/env tsx
/**
 * Generate Markdown reports from captured JSON.
 * npm run research:report -- --target convertlabs
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ensureTargetDirs } from "./paths";
import { loadRegistry, parseArgs, requireArg } from "./utils";
import type { PageCapture } from "./types";

function loadCaptures(dataDir: string): PageCapture[] {
  if (!existsSync(dataDir)) return [];

  return readdirSync(dataDir)
    .filter(
      (f) =>
        f.endsWith(".json") &&
        f !== "manifest.json" &&
        f !== "crawl-index.json" &&
        f !== "discovered-nav.json",
    )
    .map((f) => {
      const raw = readFileSync(join(dataDir, f), "utf8");
      return JSON.parse(raw) as PageCapture;
    })
    .filter((c) => c.pageId)
    .sort((a, b) => a.pageId.localeCompare(b.pageId));
}

function mdSection(title: string, level = 2): string {
  return `${"#".repeat(level)} ${title}\n\n`;
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function buildPageMap(captures: PageCapture[]): string {
  let md = mdSection("Page map");
  md += `| Page ID | Phase | Role | Title | URL |\n`;
  md += `|---------|-------|------|-------|-----|\n`;

  for (const c of captures) {
    const url = c.finalUrl || c.url;
    md += `| ${c.pageId} | ${c.phase} | ${c.role} | ${c.title.replace(/\|/g, "/")} | ${url} |\n`;
  }
  return md + "\n";
}

function buildNavigationMap(captures: PageCapture[]): string {
  let md = mdSection("Navigation map");

  for (const c of captures) {
    md += mdSection(`${c.label} (\`${c.pageId}\`)`, 3);
    const { primary, secondary, tabs } = c.navigation;

    if (primary.length) {
      md += `**Primary nav**\n\n`;
      for (const item of primary.slice(0, 40)) {
        md += `- ${item.text || item.ariaLabel}${item.href ? ` → ${item.href}` : ""}\n`;
      }
      md += "\n";
    }
    if (secondary.length) {
      md += `**Sidebar / secondary**\n\n`;
      for (const item of secondary.slice(0, 40)) {
        md += `- ${item.text || item.ariaLabel}${item.href ? ` → ${item.href}` : ""}\n`;
      }
      md += "\n";
    }
    if (tabs.length) {
      md += `**Tabs**\n\n`;
      for (const item of tabs.slice(0, 30)) {
        md += `- ${item.text || item.ariaLabel}\n`;
      }
      md += "\n";
    }
  }
  return md;
}

function buildFeatureInventory(captures: PageCapture[]): string {
  let md = mdSection("Feature inventory (auto-extracted)");
  md += `> **Human review required:** Tag each item P0 / P1 / P2 / W per RESEARCH-PLAN.md\n\n`;

  const byPhase = new Map<string, PageCapture[]>();
  for (const c of captures) {
    const list = byPhase.get(c.phase) ?? [];
    list.push(c);
    byPhase.set(c.phase, list);
  }

  for (const [phase, pages] of [...byPhase.entries()].sort()) {
    md += mdSection(phase, 3);
    for (const c of pages) {
      md += `#### ${c.label}\n\n`;
      if (c.headings.length) {
        md += `Headings: ${c.headings.map((h) => h.text).slice(0, 8).join(" · ")}\n\n`;
      }
      const actions = c.actions.buttons
        .map((b) => b.text || b.ariaLabel)
        .filter(Boolean)
        .slice(0, 15);
      if (actions.length) {
        md += `Actions: ${unique(actions).join(", ")}\n\n`;
      }
      if (c.lockIndicators.length) {
        md += `Lock/upgrade copy: ${unique(c.lockIndicators).slice(0, 5).join(" | ")}\n\n`;
      }
    }
  }
  return md;
}

function buildFormsAndFields(captures: PageCapture[]): string {
  let md = mdSection("Forms and fields");
  for (const c of captures) {
    if (!c.forms.length) continue;
    md += mdSection(`${c.label} (\`${c.pageId}\`)`, 3);
    for (const form of c.forms) {
      md += `**Form** \`${form.id}\`${form.action ? ` → ${form.action}` : ""}\n\n`;
      md += `| Label | Tag | Type | Name | Required |\n`;
      md += `|-------|-----|------|------|----------|\n`;
      for (const field of form.fields) {
        const label = (field.label || field.placeholder || field.ariaLabel || "—").replace(/\|/g, "/");
        md += `| ${label} | ${field.tag} | ${field.type || "—"} | ${field.name || "—"} | ${field.required ? "yes" : "no"} |\n`;
      }
      md += "\n";
    }
  }
  return md;
}

function buildIntegrationsMap(captures: PageCapture[]): string {
  let md = mdSection("Integrations map (auto-extracted)");
  const integrationPattern =
    /zapier|stripe|nicejob|webhook|ical|google|quickbooks|mailchimp|twilio|sms|api/i;

  for (const c of captures) {
    const hits = c.visibleTextSample.match(new RegExp(integrationPattern, "gi"));
    const navHits = [...c.navigation.primary, ...c.navigation.secondary, ...c.actions.links]
      .map((x) => x.text + x.href)
      .filter((t) => integrationPattern.test(t));

    if (!hits?.length && !navHits.length) continue;

    md += mdSection(c.label, 3);
    if (hits?.length) md += `Mentions: ${unique(hits).join(", ")}\n\n`;
    if (navHits.length) md += `Links: ${navHits.slice(0, 10).join("; ")}\n\n`;
  }

  md += mdSection("Human completion", 3);
  md += `- [ ] List each integration connector from settings UI\n`;
  md += `- [ ] Document triggers/actions from help center\n`;
  md += `- [ ] Note plan gates (Basic / Professional / Enterprise)\n\n`;

  return md;
}

function buildPricingAndLimits(captures: PageCapture[]): string {
  let md = mdSection("Pricing and limits");
  const pricingPages = captures.filter(
    (c) =>
      c.phase.includes("public") ||
      /pricing|plan|billing|subscription/i.test(c.pageId + c.url + c.title),
  );

  for (const c of pricingPages) {
    md += mdSection(c.label, 3);
    md += `Source: [${c.finalUrl || c.url}](${c.finalUrl || c.url})\n\n`;
    if (c.headings.length) {
      md += `**Headings:** ${c.headings.map((h) => h.text).join(" · ")}\n\n`;
    }
    if (c.lockIndicators.length) {
      md += `**Gated features mentioned:**\n\n`;
      for (const line of unique(c.lockIndicators).slice(0, 20)) {
        md += `- ${line.slice(0, 200)}\n`;
      }
      md += "\n";
    }
  }

  md += mdSection("Human completion", 3);
  md += `- [ ] Plan comparison table (Basic / Professional / Enterprise)\n`;
  md += `- [ ] Provider count limits, revenue caps, storage, seats\n`;
  md += `- [ ] Trial terms and card requirements\n`;
  md += `- [ ] In-app upgrade prompts (screenshot refs)\n\n`;

  return md;
}

function buildUserFlowsTemplate(): string {
  let md = mdSection("User flows");
  md += `> **Human-authored.** Automation cannot infer business logic. Document step-by-step.\n\n`;
  const flows = [
    "Owner onboarding (signup → first live booking)",
    "Customer public booking",
    "Admin creates booking manually",
    "Accept / schedule incoming request",
    "Reschedule and cancel (admin + customer portal)",
    "Assign service providers",
    "Provider day (mobile app)",
    "Payment collection and auto-charge",
    "Customer portal rebook",
  ];
  for (const flow of flows) {
    md += mdSection(flow, 3);
    md += `1. _Step — page ID / screenshot_\n`;
    md += `2. _Step_\n`;
    md += `3. _Outcome / data created_\n\n`;
    md += `**Observations:**\n\n`;
    md += `**UpNext parity:** P0 / P1 / P2 / W\n\n`;
  }
  return md;
}

function buildGapAnalysisTemplate(): string {
  let md = mdSection("Gap analysis");
  md += `| Competitor capability | Where observed | UpNext status | Priority | Notes |\n`;
  md += `|----------------------|----------------|---------------|----------|-------|\n`;
  md += `| _example: recurring bookings_ | _bookings UI_ | _missing_ | _P1_ | _ |\n\n`;
  md += mdSection("Human instructions", 3);
  md += `Compare against \`docs/02-mvp-scope.md\` and current \`/app\`, \`/book\`, \`/crew\` routes.\n\n`;
  return md;
}

function buildRecommendationsTemplate(): string {
  let md = mdSection("UpNext MVP recommendations");
  md += `> **Wedge-focused.** Do not copy feature list blindly.\n\n`;
  md += mdSection("Beat them on (W)", 3);
  md += `- \n\n`;
  md += mdSection("MVP parity required (P0)", 3);
  md += `- \n\n`;
  md += mdSection("Validated but defer (P1)", 3);
  md += `- \n\n`;
  md += mdSection("Intentionally different (P2)", 3);
  md += `- \n\n`;
  return md;
}

function buildAppCoverage(captures: PageCapture[]): string {
  const appOnly = captures.filter(
    (c) => c.role === "owner" || c.pageId.startsWith("app-"),
  );

  let md = mdSection("App coverage summary");
  md += `**Total app captures:** ${appOnly.length}\n\n`;

  const groups: Record<string, PageCapture[]> = {
    "Sidebar navigation": [],
    "Section tabs": [],
    "Settings (all tabs)": [],
    "Settings — Notifications audiences": [],
    "Forms & wizards": [],
    "Marketing": [],
    "Service catalog detail": [],
    "Modals & create flows": [],
    "Header / top bar": [],
    "Routes (BFS)": [],
    Other: [],
  };

  for (const c of appOnly) {
    const id = c.pageId;
    const label = c.label ?? "";
    if (id.includes("nav-") && !id.includes("modal")) groups["Sidebar navigation"].push(c);
    else if (id.includes("tab-") || id.includes("route-tab-"))
      groups["Section tabs"].push(c);
    else if (id.includes("deep-settings") || id.includes("settings-"))
      groups["Settings (all tabs)"].push(c);
    else if (id.includes("deep-notifications"))
      groups["Settings — Notifications audiences"].push(c);
    else if (
      label.includes("New Booking") ||
      label.includes("New Customer") ||
      id.includes("new-booking") ||
      id.includes("customer-new")
    )
      groups["Forms & wizards"].push(c);
    else if (id.includes("marketing") || label.includes("Marketing"))
      groups["Marketing"].push(c);
    else if (id.includes("service") || id.includes("deep-service"))
      groups["Service catalog detail"].push(c);
    else if (id.includes("modal") || label.includes("Modal"))
      groups["Modals & create flows"].push(c);
    else if (id.includes("header")) groups["Header / top bar"].push(c);
    else if (id.includes("route-")) groups["Routes (BFS)"].push(c);
    else groups.Other.push(c);
  }

  for (const [group, items] of Object.entries(groups)) {
    if (!items.length) continue;
    md += mdSection(group, 3);
    for (const c of items) {
      md += `- **${c.label}** — \`${c.pageId}\` — ${c.finalUrl || c.url}\n`;
    }
    md += "\n";
  }

  md += mdSection("Checklist — app surfaces", 3);
  const checklist = [
    ["Sidebar (15 sections)", appOnly.some((c) => c.pageId.includes("nav-bookings"))],
    ["Calendar tabs (Bookings, Scheduler)", appOnly.some((c) => c.label.includes("Scheduler"))],
    ["Payouts tabs", appOnly.some((c) => c.label.includes("By Service Providers"))],
    ["Discounts tabs (Codes, Gift Cards)", appOnly.some((c) => c.label.includes("Gift Cards"))],
    ["Marketing (Overview, Leads, Widgets, Automations, Campaigns)", appOnly.some((c) => c.label.includes("Campaigns"))],
    ["Settings — Services", appOnly.some((c) => c.pageId.includes("deep-settings-services"))],
    ["Settings — Payment", appOnly.some((c) => c.pageId.includes("deep-settings-payment"))],
    ["Settings — Time & Scheduling", appOnly.some((c) => c.pageId.includes("time-scheduling"))],
    ["Settings — Portals", appOnly.some((c) => c.pageId.includes("deep-settings-portals"))],
    ["Settings — Notifications + audiences", appOnly.some((c) => c.pageId.includes("deep-notifications-customers"))],
    ["Settings — Forms", appOnly.some((c) => c.pageId.includes("deep-settings-forms"))],
    ["Settings — Integrations", appOnly.some((c) => c.pageId.includes("deep-settings-integrations"))],
    ["New Booking wizard (all steps)", appOnly.some((c) => c.label.includes("Date & Time"))],
    ["New Customer form (all tabs)", appOnly.some((c) => c.label.includes("Payment Methods"))],
    ["Service detail (Pricing, Extras, Frequencies)", appOnly.some((c) => c.label.includes("Pricing Parameters"))],
    ["Public booking form", appOnly.some((c) => c.pageId.includes("booking-form"))],
    ["Company / business profile", appOnly.some((c) => c.pageId.includes("company"))],
    ["Websites + Domains", appOnly.some((c) => c.pageId.includes("websites"))],
    ["New Service / Quote / Invoice / Discount modals", appOnly.some((c) => c.pageId.includes("deep-modal"))],
    ["Profile menu — Company", appOnly.some((c) => c.pageId === "app-profile-company")],
    ["Profile menu — Accounts", appOnly.some((c) => c.pageId === "app-profile-accounts")],
    ["Profile menu — API Keys", appOnly.some((c) => c.pageId === "app-profile-api-keys")],
    ["Profile menu — Billing", appOnly.some((c) => c.pageId === "app-profile-billing")],
    ["Profile menu — Perks", appOnly.some((c) => c.pageId === "app-profile-perks")],
    ["Profile menu — Community", appOnly.some((c) => c.pageId === "app-profile-community")],
    ["Profile menu — Log Out (visible, not clicked)", appOnly.some((c) => c.pageId === "app-profile-menu-open")],
  ];

  for (const [item, done] of checklist) {
    md += `- [${done ? "x" : " "}] ${item}\n`;
  }

  return md;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const target = requireArg(args, "target");

  const registry = loadRegistry(target);
  const { data, reports } = ensureTargetDirs(target);
  const captures = loadCaptures(data);

  if (captures.length === 0) {
    console.log(`No captures in ${data}. Run research:crawl first.`);
    return;
  }

  const generatedAt = new Date().toISOString();
  const header = `# ${registry.displayName} — competitor research reports\n\nGenerated: ${generatedAt}\nPages captured: ${captures.length}\n\n> Local only — do not commit \`targets/\`\n\n---\n\n`;

  const reportsToWrite: Record<string, string> = {
    "page-map.md": header + buildPageMap(captures),
    "navigation-map.md": header + buildNavigationMap(captures),
    "feature-inventory.md": header + buildFeatureInventory(captures),
    "forms-and-fields.md": header + buildFormsAndFields(captures),
    "integrations-map.md": header + buildIntegrationsMap(captures),
    "pricing-and-limits.md": header + buildPricingAndLimits(captures),
    "user-flows.md": header + buildUserFlowsTemplate(),
    "gap-analysis.md": header + buildGapAnalysisTemplate(),
    "upnext-mvp-recommendations.md": header + buildRecommendationsTemplate(),
    "app-coverage.md": header + buildAppCoverage(captures),
  };

  for (const [filename, content] of Object.entries(reportsToWrite)) {
    const path = join(reports, filename);
    writeFileSync(path, content, "utf8");
    console.log(`Wrote ${path}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
