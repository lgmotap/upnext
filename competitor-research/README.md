# Competitor research (local only)

Systematic, legal product/UX teardown tooling for UpNext. **Captured competitor data never leaves your machine** — `targets/` and `.storage/` are gitignored.

## Rules

- Only public pages or pages reachable via **your own** trial/demo account.
- Do not bypass paywalls, CAPTCHAs, access controls, or rate limits.
- Do not copy text, design, branding, or proprietary assets into UpNext.
- Focus on feature parity, UX patterns, workflow logic, and product opportunities.
- Screenshots and extracted text are for **internal research only** — do not publish or redistribute.

## Quick start

```bash
# 1. Install Playwright browser (once)
npx playwright install chromium

# 2. Initialize local target (gitignored)
npx tsx competitor-research/scripts/init-target.ts --target convertlabs

# 3. Phase 1 — public pages (no login)
npm run research:crawl -- --target convertlabs --phase phase-01-public

# 4. Save authenticated session (headed browser — you log in manually)
npm run research:session -- --target convertlabs --role owner

# 5. Crawl authenticated phases (slow, respectful delays)
npm run research:crawl -- --target convertlabs --phase phase-03-owner-dashboard

# 6. Generate Markdown reports from captured JSON
npm run research:report -- --target convertlabs
```

## Workflow

1. Read `RESEARCH-PLAN.md` — execute phases in order.
2. After each **manual discovery** pass, update `targets/<target>/page-registry.json` with new URLs, tabs, and modals.
3. Run `research:crawl` for that phase.
4. Review screenshots + JSON; add `discovery-notes.md` entries for logic automation cannot see.
5. Re-run `research:report` after each phase.
6. Complete synthesis reports in `targets/<target>/reports/` (human-written sections marked in templates).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run research:login` | Automated app login → saves owner session |
| `npm run research:crawl-app` | Sidebar sections + settings tabs |
| `npm run research:crawl-exhaustive` | **Full pass** — sidebar, tabs, header, BFS links, modals |
| `npm run research:crawl-provider` | **Service provider portal** — teams.convertlabs.io (magic link in `.provider-portal.local.json`) |
| `npm run research:crawl-provider-workflow` | **Provider job lifecycle** — Check-In, On The Way, Running Late, Check-Out + workflow map |
| `npm run research:crawl-public-booking` | Standalone embed form (`/booking_form/{id}`) |
| `npm run research:crawl-websites` | **Website builder** — themes, WP credentials, domain modal, published site |
| `npm run research:crawl-api` | **API docs** — fetch OpenAPI spec → `api-reference.md` |
| `npm run research:crawl-wordpress` | WordPress admin (`.wordpress.local.json`; Cloudflare blocks headless) |
| `npm run research:crawl-customer-portal` | **Customer portal** — login, tabs, history (`.customer-portal.local.json`) |
| `npm run research:report` | Aggregate JSON → Markdown reports |

**Master report:** after crawling, read `targets/<target>/reports/COMPETITOR-TEARDOWN-REPORT.md` (local only).

Key flow reports: `onboarding-wizard.md`, `provider-job-workflow.md`, `customer-portal.md`, `website-builder.md`, `api-reference.md`, `public-booking-standalone.md`

## What gets committed vs local

| Committed to git | Local only (gitignored) |
|------------------|-------------------------|
| `scripts/`, `templates/`, `README.md`, `RESEARCH-PLAN.md` | `targets/**` (screenshots, JSON, reports, registry, notes) |
| | `.storage/**` |
| | `roles/*.storage.json` |

## Cursor Browser (optional)

Use the IDE browser for **exploration and validation** — finding hidden routes, confirming UX feel, comparing side-by-side with UpNext. Playwright scripts are the **repeatable capture pipeline**.
