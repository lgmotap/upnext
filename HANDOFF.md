# UpNext — Handoff / Continue-from-Cursor

Snapshot of where the project stands and exactly how to keep going. Pairs with
`.claude/CLAUDE.md`, `.cursor/rules/*`, `docs/`, and `tasks/`.

## TL;DR
- **Marketing landing page** (`/`) — done (Pluto-style green). Untouched by product work.
- **Product app** (`/app/*`) — sprints 02–08 complete. **Launch checklist** — only Resend prod domain remains.
- **Auth** (Supabase) + **Prisma 7** backend — wired; DB schema migrated (User, Organization,
  Membership, BusinessProfile).
- **Onboarding wizard** (`/app/onboarding`) — built and building green; runs once real DB env is set.
- Stack is green on **Node 22 / Prisma 7**: `db:validate`, `db:generate`, `typecheck`, `lint`, `build`.

## Phase A — Live runtime (done)

### Done via agent / MCP
- **RLS enabled** on tenant tables (Supabase MCP).
- **Env green**: `npm run check:env` passes; Prisma connects to Supabase.
- **Vercel-first local dev**: `npm run dev` uses `vercel env run`.

## Run locally
```bash
nvm use                 # Node 22 (.nvmrc)
npm install             # if engine EPERM, see note below
npm run check:env       # verify secrets before dev
npm run dev             # http://localhost:3000
```
- `/` landing · `/app/dashboard` (real data) · `/sign-in` · `/app/onboarding`.
- Until secrets are real, auth shows **"Server is not configured"** — run `npm run check:env`.

### macOS Prisma engine `EPERM` workaround
`prisma generate` may fail copying `node_modules/@prisma/engines/schema-engine-darwin-arm64`
(security policy blocks `copyfile` preserving `com.apple.provenance`). Fix:
```bash
part=$(find "$TMPDIR" -name partial 2>/dev/null | head -1)   # the downloaded binary
cp "$part" node_modules/@prisma/engines/schema-engine-darwin-arm64 && chmod +x "$_"
npm run db:generate
```
Not an issue on Linux CI / Vercel.

## Test the onboarding flow (once env is real)
1. `npm run dev` → `/sign-up` → create an account.
2. Sign-up provisions org + owner membership + BusinessProfile, then redirects to `/app/onboarding`.
3. Fill business details → Continue → "Finish & go to dashboard".
4. Verify with the Supabase connector / SQL: `Organization.timezone/currency` and
   `BusinessProfile.serviceArea/phone/description` updated for your org.

## Security: RLS (done)
RLS is **enabled** on `User`, `Organization`, `Membership`, `BusinessProfile`; `anon`/`authenticated` revoked. Prisma uses the direct postgres connection (bypasses RLS). No client-side Supabase table access in MVP.

## Architecture quick map (follow these patterns)
- `server/validators/*` — Zod input schemas
- `server/permissions/{session,can}.ts` — auth session + RBAC (deny by default)
- `server/services/*` — business logic + Prisma writes
- `server/repositories/*` — org-scoped queries
- `server/actions/*` — `"use server"` actions: session → permission → validate → service
- `app/app/*` — product UI (real data on most routes)
- `tasks/mvp-traceability.md` — **MVP scope ↔ sprint audit** (run before each sprint)
- `.cursor/rules/090-autonomous-sprint-execution.mdc` — sprint marathon: do not ask to continue
- `.claude/skills/upnext-sprint-marathon/SKILL.md` — orchestrates 07 → 08 → launch checklist

## Sprint 02 — done
Services CRUD, availability settings, public booking profile + services.

## Sprint 03 — done
Public booking with real slots, booking requests, inbox accept/decline.

## Sprint 04 — done
Accept booking → job; jobs list/detail; calendar week view; customers CRM.

## Test scripts
```bash
npm run smoke:booking   # DB + slot engine check
npm run smoke:e2e       # full seed → book → accept → job
npm run smoke:manual-booking  # owner manual booking → job (source=manual)
npm run smoke:global-search     # ⌘K search service smoke
npm run smoke:launch          # full launch checklist suite
npm run smoke:launch-onboarding
npm run smoke:launch-crew
npm run smoke:launch-payment
npm run test:e2e              # Playwright UI smoke (needs dev server on :3000)
```

## Sprint 05 — done
Job assignments, team list, crew view with worker auth.

## Sprint 06 — done
Payments, Stripe Connect + webhooks, booking detail wired, 8 notification types + NotificationLog + reminder cron, crew check-in timer + checklist + photos, team invite flow.

**Before production:** verify a sending domain on the **UpNext** Resend account and update `EMAIL_FROM` / remove `RESEND_SANDBOX_TO` — checklist in `docs/13-notifications.md` and `tasks/launch-checklist.md`.

## Sprint 07 — done
Dashboard real data · owner manual booking at `/app/bookings/new` (customer pick/create, service, addons, slot, optional worker assign, auto-accept → job, `source=manual`) · business settings wired · notification toggles persisted on `BusinessProfile` and honored by senders · billing Stripe Connect UI · dashboard/settings loading + error boundaries.

## Sprint 08 — done
App-wide error boundaries (`ErrorFallback`, `global-error`, per-route `error.tsx`) · PostHog provider + server events (booking, job, payment) · Sentry instrumentation (optional via `SENTRY_DSN`) · skip link + focus-visible a11y · Playwright e2e (`tests/e2e/critical-flows.spec.ts`) · security review (`tasks/sprint-08-security-review.md`).

## Launch checklist — almost done
Automated: `npm run smoke:launch` (onboarding → book → crew complete → payment dashboard → Stripe).

**Remaining (production gate — needs owner action):**
1. **Resend domain** — verify sending domain on UpNext Resend account; set `EMAIL_FROM` on Vercel Production; remove `RESEND_SANDBOX_TO` (`docs/13-notifications.md`).

Vercel Production backend env verified ✓ (`VERCEL_ENV_TARGET=production npm run check:env:vercel`). Legal: `/privacy` · `/terms`.

## Sprint marathon — **PAUSED** (user request)

Auto-continue hook **disabled** in `.cursor/hooks.json` (2026-06-24). The agent will no longer auto-resume on stop.

**Resume manually** when ready (paste into chat):

```
Run the UpNext sprint marathon per .cursor/rules/090-autonomous-sprint-execution.mdc
and upnext-sprint-marathon skill. Read tasks/mvp-traceability.md and HANDOFF.md,
find the first unchecked - [ ] item in launch-checklist, implement via upnext-feature-loop,
run smoke tests, mark [x], update HANDOFF.md. Do not commit unless asked.
```

To re-enable auto-continue, restore the `stop` hook in `.cursor/hooks.json` (see git history or `.cursor/hooks/sprint-marathon-continue.sh`).

- **Rule:** `.cursor/rules/090-autonomous-sprint-execution.mdc`
- **Skill:** `.claude/skills/upnext-sprint-marathon/SKILL.md`
- **Remaining:** Resend prod domain (`tasks/launch-checklist.md` line 17) — DNS verify `upnext.app` in Resend, then `VERCEL_ENV_TARGET=production npm run check:resend:production`

**PO decision (2026-06-24):** Competitor research is done. Run `tasks/mvp-traceability.md` — not more crawls — before coding.

Competitor synthesis (local): `competitor-research/targets/convertlabs/reports/gap-analysis.md`

## Phase 2 P1 parity — sprints 22–31 (planned 2026-06-24)

**Sprint 22 complete** — buffers, carry-over, frequency discounts. `npm run smoke:scheduling-depth`

**Sprint 23 complete** — half-bath + square-feet pricing params (catalog, services editor, public/manual booking). `npm run smoke:pricing-params`

**Sprint 24 complete** — optional pay at booking (Stripe Checkout on public form + manual collect). `npm run smoke:pay-at-booking`

**Sprint 25 complete** — custom booking domain host routing + Settings → Portals UI. `npm run smoke:custom-domain`

**Sprint 26 complete** — optional portal password login + Book again FAQ sidebar. `npm run smoke:portal-password` · `smoke:portal-faq`

**Sprint 37 complete** — reports date range + CSV export. `npm run smoke:reports`

**Sprint 38 complete** — customer detail tabs, tags, per-customer comms filter. `npm run smoke:crm-lists`

**Sprint 39 complete** — bookings inbox pagination, filters, bulk decline. `npm run smoke:crm-lists`

**Sprint 40 complete** — manual booking custom fields, payment step, review panel, address picker. `npm run smoke:manual-booking` · `smoke:custom-booking-fields`

**Sprint 41 complete** — calendar month view, conflict hints, pending chips. `npm run smoke:scheduler`

**Sprint 42 complete** — portal reschedule + cleaning plan sidebar. `npm run smoke:portal-reschedule`

**Sprint 43 complete** — dashboard queue KPIs (deep links), today row enrichment, crew activity, jobs/payments filters. `npm run smoke:dashboard`

**Sprint 44 complete** — time-aware greeting, `BusinessSnapshot` (30-day teaser when onboarding done), shared `period-stats`. `npm run smoke:dashboard` · `npm run smoke:reports`

**Resume:** Phase 4–5 parity sprints complete through 44. Next: `tasks/launch-checklist.md` (Resend prod domain) or backlog P2 items in `tasks/backlog.md`.

| Sprint | Focus |
|--------|--------|
| 22 | Buffers, carry-over, frequency discounts |
| 23 | Half-bath, sq ft pricing params |
| 24 | Pay at booking (optional) |
| 25 | Custom booking domain routing |
| 26 | Portal password + FAQ |
| 27 | API v1 expansion |
| 28 | Crew map + late ETA |
| 29 | SMS notifications |
| 30 | Custom booking fields |
| 31 | Drag-drop dispatch scheduler |

## Portal product review — batch 2 (2026-06-24, pushed)

**Commits:** `068e485` (shared modals) · `3074212` (action panels + server) · `72a07e1` (page wiring)

| Area | What shipped |
|------|----------------|
| Dashboard | Getting Started checklist (% complete), decline confirm on pending requests |
| Bookings | List + detail decline confirm modals; accept with loading state |
| Jobs | Assign modal, cancel confirm, start/complete with loading |
| Customers | Notes + add address modals; Book again / New booking; real booking link copy |
| Calendar | Week prev/next + Today navigation |
| Team | Invite submit loading state |
| Settings | Copy booking link button |

**Still P1 vs ConvertLabs:** Stripe saved cards in portal (done sprint 16), CSV import (done sprint 17), per-worker availability (done sprint 18).

**Resume:** Sprint **19** → `tasks/sprint-19-parity-hardening.md`

## Default service catalog (ConvertLabs-style)

- New orgs get **Residential Cleaning** catalog at sign-up (4 services + 9 add-ons, icons, bed/bath pricing).
- Legacy orgs backfill on dashboard load, public booking, and customer portal.
- Icons on public booking, services page, onboarding preview, portal “Book” tab.
- `Service.iconKey` migration `20250625230000_service_icon_key`.
- Smokes: `smoke:industry-catalog`, `smoke:launch-onboarding`.

## Sprint 17 — CRM import (done)

- `/app/customers/import` — CSV upload, template download, row errors, dedupe by email.
- `npm run smoke:customer-import`

## Sprint 18 — Per-worker availability (done)

- `MembershipAvailabilityRule` schema + org/worker rule intersection in slot engine.
- `/app/team/[membershipId]/availability` — edit worker weekly hours; team list “Hours” link.
- Manual booking filters slots when worker assigned; reschedule respects assignee hours.
- Crew `/crew` shows read-only working hours.
- `npm run smoke:worker-availability`

## Sprint 19 — parity hardening (done)

- Browser audit checklists consolidated in `docs/audits/browser-checklists.md`.
- Positioning doc `docs/audits/competitor-positioning.md`; scorecard updated for per-worker availability.
- Lint errors fixed (0 errors); `npm run build` green.
- `tests/e2e/full-product-flow.spec.ts` + `npm run test:e2e:full` (auth tests env-gated).
- All smokes 14–18 + `smoke:launch` green.

**Resume:** Sprint **36 complete**. **Next:** **`tasks/sprint-37-reports-v2.md`**. Master gap map: `docs/audits/product-gaps-roadmap.md`.

## Sprint 32–34 — CRM lists, comms log, jobs pagination (done)

- **Sprint 32**: Customers table + pagination + last job; bookings hybrid inbox. `npm run smoke:crm-lists`.
- **Sprint 33**: `/app/communications` delivery log. Linked from Settings → Notifications.
- **Sprint 34**: Jobs list pagination (50/page). Shared `ListPagination`.

## Phase 3 — Company profile & onboarding (done)

- **Sprint 35 (done):** Service area unify, logo upload, website URL — `npm run smoke:business-profile`
- **Sprint 36 (done):** Google Places autocomplete, industry cards, sign-up name dedup (Option A) — `npm run smoke:address-autocomplete`

## Phase 4 — Ops polish (planned)

- **Sprint 37 (next):** Reports date range + CSV — `tasks/sprint-37-reports-v2.md`
- **Sprint 38**: CRM tabs + tags — `tasks/sprint-38-crm-customer-depth.md`
- **Sprint 39**: Bookings inbox scale — `tasks/sprint-39-bookings-inbox-scale.md`
- **Sprint 40**: Manual booking parity — `tasks/sprint-40-manual-booking-parity.md`
- **Sprint 41**: Calendar month + conflicts — `tasks/sprint-41-calendar-month-conflicts.md`
- **Sprint 42**: Portal reschedule — `tasks/sprint-42-portal-reschedule-ux.md`
- Master map: `docs/audits/product-gaps-roadmap.md`

## Sprint 29–31 — SMS, custom fields, scheduler (done)

- **Sprint 29**: Twilio SMS (`lib/sms/twilio.ts`), settings UI, OTW/late/24h SMS mirrors. `npm run smoke:sms`.
- **Sprint 30**: `BookingFormField`, `/app/settings/booking-form`, public custom fields, `GET /api/v1/custom-fields`. `npm run smoke:custom-booking-fields`.
- **Sprint 31**: `/app/calendar/scheduler` drag-drop dispatch board. `npm run smoke:scheduler`.

## Full product v1 (sprints 14–31)

All Phase 2 parity sprints complete. **Remaining production gate (owner):** Resend domain verify + remove `RESEND_SANDBOX_TO` on Production — see `tasks/launch-checklist.md` line 17.

**Custom booking domain:** Sprint 25 — `docs/custom-booking-domain.md`.

**Deferred (Phase 3 / backlog):** Stripe Checkout Playwright E2E, P2 items in `tasks/backlog.md`.
