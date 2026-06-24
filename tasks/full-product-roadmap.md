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

**Resume:** Sprint **16** → `tasks/sprint-16-portal-depth.md` (saved Stripe cards)
