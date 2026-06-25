# MVP traceability audit

**Updated:** 2026-06-25 (Phase 4: 37–40 done; 41–42 + Phase 5 dashboard 43–44 planned)  
**Purpose:** Line-by-line check — competitor research → `docs/02-mvp-scope.md` → sprint tasks → **actual codebase**  
**Competitor synthesis:** `competitor-research/targets/convertlabs/reports/gap-analysis.md` (local, gitignored)  
**Profile gaps:** `docs/audits/business-profile-gaps.md`  
**Full roadmap:** `docs/audits/product-gaps-roadmap.md` (Phases 3–5, sprints 35–44)  
**Current status:** `tasks/competitor-parity-status.md`  
**Extensive audit plan:** `tasks/competitor-parity-audit-plan.md` (Parts 0–14)

Run this audit **before each sprint kickoff**. Do not start new competitor crawls unless a row is marked "needs CL spec."

---

## Research inventory — what was checked

| Report / source | Captures | Used in audit? |
|-----------------|----------|----------------|
| `COMPETITOR-TEARDOWN-REPORT.md` | Master | ✅ |
| `gap-analysis.md` | Synthesis table | ✅ |
| `upnext-mvp-recommendations.md` | PO backlog | ✅ |
| `user-flows.md` | 7 flows + parity tags | ✅ |
| `app-coverage.md` | 195 owner app pages | ✅ Module checklist |
| `navigation-map.md` | Tabs/sidebars | ✅ Settings + wizards |
| `provider-job-workflow.md` | Crew state machine | ✅ |
| `customer-portal.md` | 3-tab portal | ✅ P1 defer |
| `public-booking-standalone.md` | 10 form sections | ✅ |
| `onboarding-wizard.md` | 4-step signup | ✅ |
| `website-builder.md` | WordPress hub | ✅ P2 defer |
| `api-reference.md` + `integrations-map.md` | API v1 | ✅ P1 defer |
| `forms-and-fields.md` | Field-level | 🟡 Sampled (settings, wizards) |
| `feature-inventory.md` | Auto-extract | 🟡 Spot-check only (noisy) |
| `page-map.md` | URL index | 🟡 Cross-ref |
| `pricing-and-limits.md` | Plans | ✅ Tier context |
| Provider portal captures | ~42 | ✅ via workflow report |
| Help center | 4 articles | 🟡 Not full crawl — OK for MVP |

**Previous pass (earlier session):** MVP scope ↔ sprints only — caught checklist/photos drift.  
**This pass:** All flow reports + `app-coverage.md` + **grep mock pages in codebase**.

---

## Code reality — pages still on mock / shell UI

These were **missed** in the first audit because sprint files assumed "built" when only list views were wired.

| Route | Research reference | Code today | Sprint fix |
|-------|-------------------|------------|------------|
| `/app/bookings/[id]` | Owner booking detail row (weak CL capture) | **✅ Wired sprint 06** | — |
| `/app/settings/business` | CL `/company`, Getting Started | **Sectioned form** — logo/Places/cards in **35–36** | **35** |
| `/app/settings/notifications` | CL Settings → Notifications (3 audiences) | **Static toggles** — not persisted | **07** — persist + connect to sprint 06 senders |
| `/app/dashboard` | CL Dashboard widgets | **Real data** — ops polish **43–44** | **43** |
| `/app/payments` | CL Invoices / awaiting payment | **✅ Real data** | Done sprint 06 |

**Real data confirmed:** `/app/bookings` (list), `/app/jobs`, `/app/jobs/[id]`, `/app/customers`, `/app/calendar`, `/app/team`, `/app/services`, `/app/settings/availability`, `/book/[slug]`, `/crew/*`

---

## CL owner modules → UpNext decision (from `app-coverage.md`)

| ConvertLabs module | Captured? | UpNext | Priority |
|--------------------|-----------|--------|----------|
| Dashboard | ✅ | Mock → sprint 07 | P0 |
| Bookings list + **detail** | ✅ list / 🟡 detail | List ✅; detail **mock** | P0 sprint 06 |
| Calendar (+ Scheduler tab) | ✅ | Week view ✅; no drag scheduler | P0 OK |
| Customers (+ 7 tabs) | ✅ | List + detail ✅; no notes/quotes tabs | P0 OK / P1 notes |
| Service Providers | ✅ | `/app/team` ✅ | P0 |
| New Booking wizard (10 tabs) | ✅ | Not built → sprint 07 manual booking | P0 |
| Service Studio (pricing/freq/extras) | ✅ | Flat service + addons ✅; **frequency on booking** ✅ sprint 11 | P1 params deferred |
| Settings — Time & Scheduling | ✅ | Availability ✅ | P0 |
| Settings — Payment | ✅ | Not built | P0 sprint 06 |
| Settings — Notifications | ✅ | Shell UI | P0 sprint 06–07 |
| Settings — Portals | ✅ | **✅ Sprint 09–10** — booking + customer portal URLs | Done |
| Settings — Forms / Integrations | ✅ | Out of MVP | P2 |
| Getting Started checklist | ✅ | Not built | P1 |
| Quotes / Invoices / Discounts | ✅ | Out of MVP | P2 |
| Marketing / Websites / Domains | ✅ | Out of MVP | P2 |
| Payouts / Providers Activity | ✅ | Out of MVP | P1/P2 |
| Profile — API Keys / Billing | ✅ | Partial (`/app/settings/billing` exists) | P1 API |
| Global search ⌘K | ✅ | **✅ Sprint 12** — `CommandPalette` + `globalSearch` | Done |

---

## CL flow reports → UpNext (parity)

| Flow report | CL | UpNext | Gap |
|-------------|-----|--------|-----|
| `onboarding-wizard.md` | Industry/location/Places/SaaS card (CL: AI name) | 4-step wizard + catalog preview | **36** Places + cards; **35** service area; **no AI naming** |
| `public-booking-standalone.md` | 10 sections incl. frequency + payment | Multi-step, no frequency, no payment | Payment sprint 06; frequency P1 |
| `provider-job-workflow.md` | Check-in timer, On The Way, Late | Start/complete only | Timer P0 sprint 06; OTW/Late P1 |
| `customer-portal.md` | Login, Book Again, History, Cards | Not built | P1 post-MVP |
| `website-builder.md` | WordPress provision | Not built | P2 |
| `api-reference.md` | Read API + 5 webhooks | Not built | P1 |

---

## CL notification types (from settings UI + research)

Map to sprint 06 — **expand** beyond the 4 emails previously listed:

| Notification | CL audience | UpNext sprint |
|--------------|-------------|---------------|
| Booking request received | Customer | 06 ✅ (stub exists) |
| New booking request | Owner | 06 — **add** |
| Booking accepted / confirmed | Customer | 06 |
| Job assigned | Worker | 06 |
| 24h reminder | Customer | 06 |
| 2h same-day reminder | Customer | 06 — **add** (UI already in settings shell) |
| Job completed summary | Customer | 06 — **add** |
| Payment link / request | Customer | 06 |
| On The Way / Running Late | Customer | P1 backlog |

---

## MVP scope → sprint mapping

| MVP scope item | Success criteria | Sprint | Task status | Gap / action |
|----------------|------------------|--------|-------------|--------------|
| Auth | — | 01 | ✅ Done | — |
| Org / business setup | Onboard without help | 01 | ✅ Done | Onboarding copy link ✅ |
| Services | — | 02 | ✅ Done | — |
| Availability | — | 02 | ✅ Done | — |
| Public booking page | Customer can submit request | 03 | ✅ Done | — |
| Booking inbox | Business can accept | 03 | ✅ List + detail | Detail wired sprint 06 |
| Jobs | Schedule after accept | 04 | ✅ Done | — |
| Calendar | — | 04 | ✅ Done | — |
| Customers CRM | — | 04 | ✅ Done | Notes UI P1 |
| Team | — | 05 | ✅ Done | Invite → 06 |
| Crew view | Team member sees job on mobile | 05 | 🟡 Partial | Timer/checklist/photos → 06 |
| **Checklists** | Complete job on mobile | **06** | ⬜ Planned | Was "later" in 05 |
| **Basic photo upload** | Complete job on mobile | **06** | ⬜ Planned | Was "later" in 05 |
| Payment status | Track payment status | 06 | ✅ Built | PaymentRecord + manual + Stripe |
| Stripe payment link | Track payment status | 06 | ✅ Built | Connect UI; needs live keys for Checkout E2E |
| Email notifications | Confirmations work | 06 | ✅ Built | **Prod:** verify Resend domain; remove sandbox |
| Dashboard | Useful daily view | 07 | ⬜ Mock | — |
| Settings | — | 07 | 🟡 Partial | Business + notifications mock |

---

## Release standard → sprint mapping

| Release standard | Sprint | Status | Gap |
|------------------|--------|--------|-----|
| Core flow end-to-end (incl. **payment**) | 06–08 | 🟡 | Payment + crew depth |
| Auth + permissions (RBAC) | 05, 08 | 🟡 | Audit in 08 |
| Public booking + rate limit | 03 | ✅ | — |
| Stripe webhooks idempotent | 06 | ⬜ | — |
| Emails sending + **logged** | 06 | ✅ | **Prod:** Resend domain on UpNext account — `docs/13-notifications.md` |
| Errors handled; Sentry | 08 | ⬜ | — |
| PostHog analytics | 08 | ⬜ | — |
| Key flows tested | 08 | 🟡 | Extend smoke:e2e |

---

## Competitor-informed P0 (operational, not scope creep)

| Item | Research source | Sprint |
|------|-----------------|--------|
| Wire booking **detail** page | `app-coverage` + weak CL row capture | **06** |
| Owner manual booking | `app-bookings-new` 10-tab wizard | **07** |
| Crew check-in timer | `provider-job-workflow.md` | **06** |
| Copy booking link in settings | Getting Started checklist | **07** |
| Wire business settings | `/company` | **07** + **35–36** profile parity |
| Team invite | Provider magic link pattern | **06** |
| P1 — search / notifications | ⌘K + bell | **Done** (sprint 12 + app shell) |
| Reports depth | `/booking/reports` | **Sprint 37** |
| CRM tabs / tags | 7-tab customer | **Sprint 38** |
| Bookings inbox scale | List filters | **Sprint 39** |
| Manual booking parity | 10-tab wizard | **Sprint 40** |
| Calendar month view | Week + scheduler | **Sprint 41** |
| Portal reschedule | Customer portal | **Sprint 42** |

---

## Explicitly deferred (P1/P2)

| Item | Backlog | CL report |
|------|---------|-----------|
| Customer portal | ✅ **Sprint 10** | `customer-portal.md` | `/my/[slug]`, magic link, dashboard tabs |
| Recurring / frequency | ✅ frequency stored | Service Studio Frequencies | **Cron/JobSeries deferred** Phase 3 |
| Pricing parameters | — | Service Studio |
| On The Way / Running Late | ✅ | `provider-job-workflow.md` |
| Public API + webhooks | gap-analysis | `api-reference.md` |
| Website / marketing / quotes / invoices | Out of scope | `app-coverage.md` |
| Getting Started % checklist | ✅ dashboard | `onboarding-wizard.md` |
| Company profile polish | `/company` | **Sprints 35–36** |
| Phase 4 ops polish | reports, CRM, inbox, etc. | **Sprints 37–42** |
| Help center full crawl | — | 4/?? articles |

---

## Audit verdict (2026-06-25 post-beta)

| Question | Answer |
|----------|--------|
| Post-beta sprints 09–12 | **Complete** — portal reliability, customer portal, booking parity, ⌘K search |
| Launch checklist | **1 item** — Resend prod domain (owner DNS action) |
| Next build candidates | Recurring engine (cron), pricing params, full Playwright signup→pay E2E, backlog (`tasks/backlog.md`) |

---

## Sprint order (complete)

```
Sprint 06–08  MVP + launch hardening — done
Sprint 09     Portal reliability — done
Sprint 10     Customer portal v1 — done
Sprint 11     Public booking parity — done
Sprint 12     Operations growth — done (frequency UI, ⌘K, payment link; cron deferred)
```

See `tasks/post-beta-roadmap.md`, `tasks/sprint-09-portal-reliability.md` through `sprint-12-operations-growth.md`.
