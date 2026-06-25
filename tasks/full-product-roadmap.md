# Full product roadmap — ConvertLabs parity → production-ready

**Created:** 2026-06-25  
**Goal:** A **fully functional** daily OS for home-service businesses — every shipped screen works end-to-end; credible parity with ConvertLabs on core ops; clear positioning on omitted modules.

**Prerequisites (done):** MVP sprints 00–08 · post-beta 09–13 · launch smokes green · parity audit plan.

**Status doc:** `tasks/competitor-parity-status.md`  
**Audit playbook:** `tasks/competitor-parity-audit-plan.md` (Parts 0–14)

---

## What “full functional” means

1. **Core loop** — book (public + manual + recurring) → accept → schedule → crew complete → pay — no dead ends.
2. **Customer surfaces** — public booking, embed, portal (history, book again, cancel, pay).
3. **Owner surfaces** — dashboard, inbox, calendar, jobs, customers, team, services, payments, reports, settings — all on real data.
4. **Field** — `/crew` exceeds CL web (checklist, photos, timer, OTW/late).
5. **Automation** — reminder cron + **recurring job generation** + notification toggles honored.
6. **Quality** — smokes for every critical path; Playwright signup→pay; tenant RBAC enforced.
7. **Production** — Resend domain, env on Vercel, optional custom booking domain.

**Out of scope (intentional):** website builder, marketing campaigns, quotes/invoices pipeline, gift cards, payouts, multi-location, native apps.

---

## Sprint order (14 → 21)

```
Sprint 14  Recurring jobs engine — JobSeries, cron, owner pause/cancel
Sprint 15  Pricing parameters — bed/bath (cleaning wedge) on book flows
Sprint 16  Portal depth — customer cancel upcoming, Stripe saved cards
Sprint 17  CRM import — CSV customers + dedupe
Sprint 18  Per-worker availability — slots respect assigned crew
Sprint 19  Parity hardening — full Playwright E2E, audit parts 1–11, lint fixes
Sprint 20  API v1 — read API + webhooks (Zapier path)
Sprint 21  Production launch — custom domain guide, launch checklist, docs
```

**Parallel track:** Execute `competitor-parity-audit-plan.md` Parts 1–13 during sprints 14–19 (browser + smoke evidence per part).

---

## Sprint → gap mapping

| Sprint | Closes gap(s) | CL reference |
|--------|---------------|--------------|
| 14 | Recurring frequency → real jobs | Service Studio Frequencies |
| 15 | Pricing parameters | Service Studio Pricing Parameters |
| 16 | Portal cancel + saved cards | `customer-portal.md` |
| 17 | CSV import | Customers module |
| 18 | Per-worker availability | Provider Availability tab |
| 19 | Full E2E + audit completion | Release standard |
| 20 | Read API + webhooks | `api-reference.md` |
| 21 | Custom domain + prod gates | Domains + launch checklist |

---

## Success criteria (full product v1)

| # | Criterion | Verified by |
|---|-----------|-------------|
| 1 | Weekly recurring booking auto-generates next job | `smoke:recurring` |
| 2 | Bed/bath adjusts price on public + manual book | `smoke:pricing-params` |
| 3 | Customer cancels upcoming from portal (policy) | `smoke:portal-cancel` |
| 4 | Owner imports 50 customers via CSV | `smoke:customer-import` |
| 5 | Slots exclude unavailable workers | `smoke:worker-availability` |
| 6 | Playwright: signup → onboard → book → crew → pay | `test:e2e:full` |
| 7 | API returns bookings for org API key | `smoke:api` |
| 8 | Production email from verified domain | `check:resend:production` |

---

## Task files

| Sprint | File |
|--------|------|
| 14 | `tasks/sprint-14-recurring-jobs.md` |
| 15 | `tasks/sprint-15-pricing-parameters.md` |
| 16 | `tasks/sprint-16-portal-depth.md` |
| 17 | `tasks/sprint-17-crm-import.md` |
| 18 | `tasks/sprint-18-worker-availability.md` |
| 19 | `tasks/sprint-19-parity-hardening.md` |
| 20 | `tasks/sprint-20-api-v1.md` |
| 21 | `tasks/sprint-21-production-launch.md` |

---

## Agent execution

Per `.cursor/rules/090-autonomous-sprint-execution.mdc` + `upnext-sprint-marathon`:

1. Read `tasks/full-product-roadmap.md` → current sprint file → first unchecked `- [ ]`.
2. Apply `upnext-feature-loop` for each item.
3. Run smokes; mark `[x]`; update `HANDOFF.md` + `CHANGELOG.md`.
4. Continue to next sprint without asking.
5. Stop only on **BLOCKER** (secrets, ambiguous product).

**Resume (full product v1):** Complete — see **Phase 2 P1 parity** below.

---

## Phase 2 — P1 parity (sprints 22 → 31)

**Created:** 2026-06-24  
**Context:** Competitor audit P1 gaps after sprints 14–21. Closes credible “same as ConvertLabs” sales objections without building website/marketing/quotes modules.

**Prerequisites:** Sprint 21 complete except Resend prod domain (owner action).

```
Sprint 22  Scheduling depth — buffers, carry-over, frequency discounts
Sprint 23  Pricing params — half-bath, sq ft
Sprint 24  Pay at booking (optional toggle)
Sprint 25  Custom booking domain — host routing impl
Sprint 26  Portal — password login option + FAQ on rebook
Sprint 27  API v1 expansion — availability, extras, frequencies, company, settings
Sprint 28  Crew polish — embedded map, running-late ETA
Sprint 29  SMS notifications
Sprint 30  Custom booking fields (lite forms)
Sprint 31  Dispatch scheduler — drag-drop board
```

**Agent resume:** Sprints **32–34 complete**. Next: **Phase 3** sprints **35–36** (company profile + onboarding UX). See `docs/audits/business-profile-gaps.md`.

---

## Phase 3 — Company profile & onboarding (sprints 35 → 36)

**Created:** 2026-06-25  
**Context:** Settings → Business rework exposed gaps vs ConvertLabs `/company` and onboarding wizard — logo, website, service-area consistency, Places, industry cards.

```
Sprint 35  Company profile parity — service area unify, logo upload, website URL
Sprint 36  Onboarding & address UX — Google Places, industry cards, sign-up dedup
```

### Sprint → gap mapping

| Sprint | Closes gap | CL reference |
|--------|------------|--------------|
| 35 | Shared service area UX; logo; website on profile + booking | `/company`, R1 logo |
| 36 | Places address; industry cards; less duplicate sign-up asks | Onboarding wizard step 1–2 |

### Phase 3 success criteria

| # | Criterion | Verified by |
|---|-----------|-------------|
| 1 | Onboarding + settings produce same `serviceArea` format | `smoke:business-profile` |
| 2 | Logo upload persists and shows on `/book/[slug]` | `smoke:business-profile` |
| 3 | Places fills address when API key set; manual fallback works | `smoke:address-autocomplete` |
| 4 | Industry cards on onboarding step 1 | `smoke:launch-onboarding` |

### Phase 3 task files

| Sprint | File |
|--------|------|
| 35 | `tasks/sprint-35-company-profile-parity.md` |
| 36 | `tasks/sprint-36-onboarding-address-ux.md` |

### Phase 3 backlog (not scheduled)

- Service-area zip/radius enforcement
- Branding colors on booking page
- Editable `publicSlug`

**Not planned:** AI business name suggestions (CL-only; out of MVP scope).

See `tasks/backlog.md` P2.

---

## Phase 4 — Ops polish (sprints 37 → 42)

**Created:** 2026-06-25  
**Context:** System audit after Phase 3 — remaining 🟡 scorecard items in reports, CRM, inbox, manual booking, calendar, portal.  
**Master audit:** `docs/audits/product-gaps-roadmap.md`

```
Sprint 37  Reports v2 — date range picker + CSV export
Sprint 38  CRM depth — customer detail tabs + tags UI
Sprint 39  Bookings inbox — pagination, filters, bulk decline
Sprint 40  Manual booking — custom fields, payment section, review panel
Sprint 41  Calendar — month view + conflict hints on week/month
Sprint 42  Portal — customer reschedule + Book Again sidebar polish
```

### Sprint → gap mapping

| Sprint | Closes gap | CL reference |
|--------|------------|--------------|
| 37 | Reports date range + export | `/booking/reports` |
| 38 | Customer 7-tab lite + tags | Customers module Part 7 |
| 39 | Inbox scale + bulk | Bookings module |
| 40 | Manual book payment + fields | 10-tab wizard (practical subset) |
| 41 | Month calendar + conflicts UI | Calendar |
| 42 | Portal reschedule | `customer-portal.md` |

### Phase 4 success criteria

| # | Criterion | Verified by |
|---|-----------|-------------|
| 1 | Reports export CSV for date range | `smoke:reports` |
| 2 | Customer tags save + filter | smoke CRM |
| 3 | Bookings history paginated | `smoke:crm-lists` |
| 4 | Manual booking includes custom fields | `smoke:manual-booking` |
| 5 | Month view on `/app/calendar` | browser + build |
| 6 | Portal reschedule within policy | `smoke:portal-reschedule` |

### Phase 4 task files

| Sprint | File |
|--------|------|
| 37 | `tasks/sprint-37-reports-v2.md` |
| 38 | `tasks/sprint-38-crm-customer-depth.md` |
| 39 | `tasks/sprint-39-bookings-inbox-scale.md` |
| 40 | `tasks/sprint-40-manual-booking-parity.md` |
| 41 | `tasks/sprint-41-calendar-month-conflicts.md` |
| 42 | `tasks/sprint-42-portal-reschedule-ux.md` |

**Agent resume after Phase 3:** Phase 5 complete. See `tasks/launch-checklist.md` for production gate.

---

## Phase 5 — Dashboard parity (sprints 43 → 44)

**Created:** 2026-06-25  
**Context:** Dashboard vs ConvertLabs audit — ops queue semantics and post-onboarding analytics teaser. Core loop already ✅; this closes sales perception gap on the home screen.

```
Sprint 43  Dashboard ops — KPI queues, deep links, today enrichment, crew activity
Sprint 44  Dashboard analytics — 30d snapshot, greeting, post-checklist business row
```

### Sprint → gap mapping

| Sprint | Closes gap | CL reference |
|--------|------------|--------------|
| 43 | Ops KPI queues + Create Booking CTA | Dashboard top cards |
| 43 | Today bookings rich rows + crew activity | Today Bookings + Activity |
| 44 | 30-day booking/revenue snapshot | Bookings summary + gross revenue (lite) |
| 44 | Time-aware greeting + business name | Dashboard header |

### Phase 5 success criteria

| # | Criterion | Verified by |
|---|-----------|-------------|
| 1 | KPI click lands on filtered jobs/payments/bookings | `smoke:dashboard` |
| 2 | Dashboard header primary CTA is New booking | browser |
| 3 | Today schedule shows address + price when data exists | `smoke:dashboard` |
| 4 | Activity includes OTW/late from NotificationLog | `smoke:dashboard` |
| 5 | After onboarding 100%, snapshot row visible | `smoke:dashboard` |
| 6 | 30-day revenue teaser links to reports range | `smoke:dashboard` |

### Phase 5 task files

| Sprint | File |
|--------|------|
| 43 | `tasks/sprint-43-dashboard-ops-parity.md` |
| 44 | `tasks/sprint-44-dashboard-analytics-snapshot.md` |

**Out of scope (Phase 5):** MRR widget, retention rate, 90-day line chart, Help Center header link (backlog P2).

---

## Phase 6 — P2 post-parity (sprints 45 → 49)

**Created:** 2026-06-25  
**Context:** Post-parity backlog promotion after Phases 3–5. ADR: `docs/adr/0007-post-mvp-p2-scope.md`  
**Status:** Planned — **sprint 45 next build**

```
Sprint 45  Service-area enforcement — zip allowlist + radius from HQ
Sprint 46  Multi-location — Location entity, per-location booking (planning)
Sprint 47  Provider Open Jobs — crew self-claim pool (planning)
Sprint 48  Providers Activity — dispatcher kanban board (planning)
Sprint 49  Promo codes — portal rebook + public book (planning)
```

### Sprint → gap mapping

| Sprint | Closes gap | CL reference |
|--------|------------|--------------|
| 45 | Service geo zones / out-of-area rejection | Service Studio zones (inferred) |
| 46 | Multi-branch operators | Multi-location (deferred MVP) |
| 47 | Open Jobs self-claim | Provider portal Open Jobs tab |
| 48 | Providers Activity board | `/providers-activity` module |
| 49 | Promo on rebook | Discounts module (lite) |

### Phase 6 success criteria (sprint 45 first)

| # | Criterion | Verified by |
|---|-----------|-------------|
| 1 | Owner enables zip list; public book outside zip blocked | `smoke:service-area-enforcement` |
| 2 | Manual book outside area allows dispatcher override | same smoke |
| 3 | Default off — existing orgs unchanged | `smoke:business-profile` |
| 4 | Radius mode requires HQ coordinates | settings UI + smoke |

### Phase 6 task files

| Sprint | File |
|--------|------|
| 45 | `tasks/sprint-45-service-area-enforcement.md` |
| 46 | `tasks/sprint-46-multi-location.md` |
| 47 | `tasks/sprint-47-provider-open-jobs.md` |
| 48 | `tasks/sprint-48-providers-activity-kanban.md` |
| 49 | `tasks/sprint-49-promo-codes-portal-rebook.md` |

**Still backlog (no sprint file):** branding colors, editable slug, iCal/Zapier, native apps, website builder.

---

### Phase 2 → P1 gap mapping (sprints 22–31)

| Sprint | Closes gap | CL reference |
|--------|------------|--------------|
| 22 | Buffer between jobs, carry-over, frequency % off | Time & Scheduling · Service Studio Frequencies |
| 23 | Half-bath, sq ft pricing matrix | Pricing Parameters |
| 24 | Pay at booking | Public form Credit Card step |
| 25 | `book.customer.com` without redirect | Domains |
| 26 | Password portal + FAQ sidebar | `customer-portal.md` |
| 27 | API catalog sync | `api-reference.md` |
| 28 | Map in crew drawer, late ETA | `provider-job-workflow.md` |
| 29 | SMS reminders / OTW | Help + marketing claims |
| 30 | Additional info fields | Settings → Forms |
| 31 | Drag-drop scheduler | Calendar Scheduler tab |

### Phase 2 success criteria

| # | Criterion | Verified by |
|---|-----------|-------------|
| 1 | Back-to-back slots respect buffer | `smoke:scheduling-depth` |
| 2 | Half-bath + sq ft adjust price | `smoke:pricing-params` |
| 3 | Pay at book works when toggled on | `smoke:pay-at-booking` |
| 4 | Custom host serves booking root | `smoke:custom-domain` |
| 5 | Portal password + FAQ when enabled | `smoke:portal-password` |
| 6 | API returns availability + company | `smoke:api` |
| 7 | SMS sent when toggled (mock/live) | `smoke:sms` |
| 8 | Custom fields on public book | `smoke:custom-booking-fields` |
| 9 | Drag reschedule on scheduler | `smoke:scheduler` |

### Phase 2 task files

| Sprint | File |
|--------|------|
| 22 | `tasks/sprint-22-scheduling-depth.md` |
| 23 | `tasks/sprint-23-pricing-params-expansion.md` |
| 24 | `tasks/sprint-24-pay-at-booking.md` |
| 25 | `tasks/sprint-25-custom-booking-domain.md` |
| 26 | `tasks/sprint-26-portal-auth-ux.md` |
| 27 | `tasks/sprint-27-api-v1-expansion.md` |
| 28 | `tasks/sprint-28-crew-field-polish.md` |
| 29 | `tasks/sprint-29-sms-notifications.md` |
| 30 | `tasks/sprint-30-custom-booking-fields.md` |
| 31 | `tasks/sprint-31-dispatch-scheduler.md` |
