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

**Still P1 vs ConvertLabs:** recurring bookings, pricing parameters, customer portal, ⌘K search, On The Way / Running Late.

**Validation:** `npm run typecheck` ✓ · `db:validate` needs Node ≥ 20.19 (use `nvm use` / Node 22).
