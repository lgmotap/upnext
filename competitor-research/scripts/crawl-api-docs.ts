#!/usr/bin/env tsx
/**
 * Fetch OpenAPI spec + generate API reference report.
 * npm run research:crawl-api -- --target convertlabs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs, requireArg } from "./utils";
import { targetDir } from "./paths";

const OPENAPI_URL = "https://api.convertlabs.io/docs/api.json";
const DOCS_URL = "https://api.convertlabs.io/#description/introduction";

interface OpenAPISpec {
  info: { title: string; version: string; description: string };
  servers: Array<{ url: string; description?: string }>;
  paths: Record<string, Record<string, { summary?: string; tags?: string[]; description?: string }>>;
  components?: { schemas?: Record<string, { properties?: Record<string, unknown> }> };
}

function schemaFields(spec: OpenAPISpec, name: string): string[] {
  const props = spec.components?.schemas?.[name]?.properties ?? {};
  return Object.keys(props);
}

async function main() {
  const target = requireArg(parseArgs(process.argv.slice(2)), "target");
  const dataDir = join(targetDir(target), "data", "api");
  const reportDir = join(targetDir(target), "reports");
  mkdirSync(dataDir, { recursive: true });
  mkdirSync(reportDir, { recursive: true });

  const res = await fetch(OPENAPI_URL);
  if (!res.ok) throw new Error(`Failed to fetch OpenAPI: ${res.status}`);
  const spec = (await res.json()) as OpenAPISpec;
  writeFileSync(join(dataDir, "openapi.json"), JSON.stringify(spec, null, 2));

  const endpoints: Array<{ method: string; path: string; tag: string; summary: string }> = [];
  for (const [path, methods] of Object.entries(spec.paths)) {
    for (const [method, op] of Object.entries(methods)) {
      if (!["get", "post", "put", "patch", "delete"].includes(method)) continue;
      endpoints.push({
        method: method.toUpperCase(),
        path,
        tag: op.tags?.[0] ?? "",
        summary: op.summary ?? "",
      });
    }
  }

  const lines = [
    "# ConvertLabs API reference",
    "",
    `**Docs:** [api.convertlabs.io](${DOCS_URL})`,
    `**OpenAPI:** [api.json](https://api.convertlabs.io/docs/api.json)`,
    `**Generated:** ${new Date().toISOString()}`,
    "",
    "## Overview",
    "",
    `- **Base URL:** \`${spec.servers[0]?.url ?? "https://api.convertlabs.io"}\``,
    `- **Version:** ${spec.info.version}`,
    `- **Auth:** Bearer token from Dashboard → Settings → API Tokens`,
    `- **Rate limit:** 60 requests/minute/account`,
    "",
    "## Authentication",
    "",
    "```http",
    "Authorization: Bearer YOUR_TOKEN",
    "```",
    "",
    "Token created in owner app at `/api-keys` (Profile menu → API Keys). Shown once on create.",
    "",
    "## Error codes",
    "",
    "| Status | Meaning |",
    "|--------|---------|",
    "| 401 | Invalid or missing token |",
    "| 403 | Token lacks permission |",
    "| 404 | Resource not found |",
    "| 422 | Validation error (`errors` field) |",
    "| 500 | Server error |",
    "",
    "## Endpoints",
    "",
    "| Method | Path | Tag | Summary |",
    "|--------|------|-----|---------|",
    ...endpoints.map((e) => `| ${e.method} | \`${e.path}\` | ${e.tag} | ${e.summary || "—"} |`),
    "",
    "## Resource schemas (fields)",
    "",
  ];

  for (const schema of [
    "BookingResource",
    "CustomerResource",
    "ServiceResource",
    "ExtraResource",
    "FrequencyResource",
    "CategoryResource",
    "CompanyResource",
    "CustomFieldResource",
    "LeadResource",
    "LeadListResource",
    "WebhookResource",
    "SettingResource",
    "SalesTaxResource",
    "FaqResource",
  ]) {
    const fields = schemaFields(spec, schema);
    if (fields.length) {
      lines.push(`### ${schema}`, "", fields.map((f) => `- \`${f}\``).join("\n"), "");
    }
  }

  lines.push(
    "## Webhook events",
    "",
    "Register via `POST /webhooks` with `{ url, event }`:",
    "",
    "| Event |",
    "|-------|",
    "| `booking.created` |",
    "| `booking.completed` |",
    "| `booking.canceled` |",
    "| `customer.created` |",
    "| `lead.created` |",
    "",
    "## Query parameters (selected)",
    "",
    "| Endpoint | Params |",
    "|----------|--------|",
    "| `GET /bookings` | `status`, `page`, `per_page`, `sort`, `order`, `expand` |",
    "| `GET /availability` | `service_date`, `duration`, `location_id` |",
    "| `GET /customers` | `search`, `page`, `per_page`, `sort`, `order` |",
    "",
    "",
    "The public API is **predominantly read-only**. The only write endpoints are:",
    "",
    "| Method | Path | Purpose |",
    "|--------|------|---------|",
    "| POST | `/webhooks` | Register webhook |",
    "| DELETE | `/webhooks/{id}` | Remove webhook |",
    "",
    "There is **no API** to create/update bookings, customers, or services in v1.0.0 — integrations likely use webhooks for outbound events + GET for sync.",
    "",
    "## UpNext comparison",
    "",
    "| ConvertLabs API | UpNext MVP |",
    "|-----------------|------------|",
    "| GET bookings, customers, services | Internal Prisma — no public API in MVP |",
    "| Webhooks POST/DELETE | Consider post-MVP for Zapier parity |",
    "| 60 req/min | Reasonable default for read API |",
    "| Bearer from Settings | UpNext could use org-scoped API keys |",
    "| Read-only catalog sync | Useful pattern for partner integrations |",
    "",
    "## Local files",
    "",
    "- `data/api/openapi.json` — full spec (gitignored)",
    "",
  );

  writeFileSync(join(reportDir, "api-reference.md"), lines.join("\n"), "utf8");
  console.log(`Endpoints: ${endpoints.length}`);
  console.log(`Report: ${join(reportDir, "api-reference.md")}`);
}

main();
