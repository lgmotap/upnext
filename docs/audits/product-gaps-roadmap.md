# Product gaps roadmap — system audit → sprints

**Updated:** 2026-06-25  
**Method:** Code inspection + `tasks/competitor-parity-audit-plan.md` + CL scorecard  
**Execution order:** `tasks/full-product-roadmap.md`

---

## Phase summary

| Phase | Sprints | Theme | Status |
|-------|---------|-------|--------|
| 2 P1 parity | 22–31 | Scheduling, pay-at-book, domain, portal auth, API, SMS, fields, scheduler | ✅ Done |
| 2.5 CRM scale | 32–34 | List tables, comms log, jobs pagination | ✅ Done |
| 3 Profile | 35–36 | Company `/company` parity, onboarding UX | ✅ Done |
| 4 Ops polish | 37–42 | Reports, CRM depth, inbox, manual book, calendar, portal | ✅ Done (37–42) |
| 5 Dashboard parity | 43–44 | CL ops queues + analytics snapshot | ✅ Done |
| Launch gate | — | Resend prod domain | ⏳ Owner action |

**Out of scope (never schedule):** AI business name, website builder, quotes/invoices pipeline, gift cards, multi-location, native apps, marketing campaigns.

---

## Sprint map by product area

### Onboarding & company profile → **35–36**

| Gap | Code today | Sprint |
|-----|------------|--------|
| Service area unify (onboarding text vs settings coverage) | `OnboardingWizard.tsx` vs `BusinessProfileForm.tsx` | **35** |
| Logo upload + `/book` display | `logoUrl` in schema; letter avatar only | **35** |
| Website URL | `websiteUrl` in schema; no UI | **35** |
| Google Places on business address | Manual fields; `lib/maps/address.ts` embed only | **36** |
| Industry cards | Dropdowns step 1 | **36** |
| Sign-up / onboarding name dedup | Both collect business name | **36** |
| Places on public booking address | Manual address step | **36** (optional item) |

Detail: `docs/audits/business-profile-gaps.md`

---

### Reports → **37**

| Gap | Code today | Sprint |
|-----|------------|--------|
| Date range picker | Fixed week/month/4-week in `server/services/reporting.ts` | **37** |
| CSV export | Deferred in sprint 13 | **37** |
| Deeper analytics / charts | Stat cards + simple bars only | **37** (v2 scope) |

Routes: `/app/reports`

---

### CRM & customers → **38**

| Gap | Code today | Sprint |
|-----|------------|--------|
| CL 7-tab customer detail | Single scroll page at `/app/customers/[id]` | **38** (tabs: overview, notes, jobs, addresses, payments) |
| Tags / segments UI | `Customer.tags` in schema; read-only display | **38** |
| Per-customer comms filter | Org log at `/app/communications` only | **38** |
| Quotes / invoices tabs | Not in MVP | ➖ Defer |

Routes: `/app/customers`, `/app/customers/[customerId]`

---

### Bookings inbox → **39**

| Gap | Code today | Sprint |
|-----|------------|--------|
| Inbox pagination | Full org load in `app/app/bookings/page.tsx` | **39** |
| Status / date / search filters | No filters | **39** |
| Bulk accept / decline | Per-card actions only | **39** |

Routes: `/app/bookings`

---

### Manual booking → **40**

| Gap | Code today | Sprint |
|-----|------------|--------|
| CL 10-tab wizard UX | 5-section single page `ManualBookingClient.tsx` | **40** (payment step + summary; not full tab clone) |
| Custom booking fields on manual flow | Public form only (sprint 30) | **40** |
| Dedicated payment step | Checkbox `collectPaymentNow` only | **40** |
| Review / confirm step | Inline submit | **40** |

Routes: `/app/bookings/new`

---

### Calendar → **41**

| Gap | Code today | Sprint |
|-----|------------|--------|
| Month view on owner calendar | Week only; `BookingMonthCalendar` used in booking flows | **41** |
| Conflict warnings on calendar UI | `lib/scheduling/conflicts.ts` used on reschedule, not calendar | **41** |
| Pending bookings on calendar | Jobs only on week view | **41** (optional) |

Routes: `/app/calendar`, `/app/calendar/scheduler`

---

### Customer portal → **42**

| Gap | Code today | Sprint |
|-----|------------|--------|
| Portal reschedule upcoming booking | Cancel + rebook via FAQ; owner reschedule exists | **42** |
| Cleaning-plan / sidebar on Book Again | FAQ accordion only (sprint 26) | **42** (lite) |
| Referral tab | Not built | ➖ Backlog idea |

Routes: `/my/[businessSlug]/dashboard`

---

### Dashboard → **43–44** ✅

| Gap | Code today | Sprint |
|-----|------------|--------|
| CL ops KPI queues (booked / scheduled / payment / unassigned) | `queueStats` + deep links on `/app/dashboard` | **43** ✅ |
| Primary Create Booking CTA on dashboard | New booking + View calendar header CTAs | **43** ✅ |
| Today jobs rich card (address, price, frequency) | Enriched `DashboardJobRow` | **43** ✅ |
| Crew events in activity feed | `NotificationLog` crew templates merged | **43** ✅ |
| 30-day booking/revenue snapshot widgets | `BusinessSnapshot` + `period-stats` | **44** ✅ |
| Time-aware greeting + business name | `lib/datetime/greeting.ts` | **44** ✅ |
| Post-onboarding dashboard density | Snapshot replaces checklist at 100% | **44** ✅ |
| MRR / retention / 90d line chart | Not built | ➖ Defer (out of MVP) |

Audit: `canvases/dashboard-vs-convertlabs.canvas.tsx`

Routes: `/app/dashboard`

---

### App shell → no dedicated sprint (P2 backlog)

| Gap | Code today | Note |
|-----|------------|------|
| Full notification center | `NotificationBell` — pending + recent activity | Adequate for MVP |
| Profile menu extras (help, plan badge) | `ProfileMenu` — settings, billing, sign out | P2 if needed |

Shipped: `CHANGELOG.md` app shell parity.

---

### Production launch → owner action

| Item | Doc |
|------|-----|
| Resend domain verify | `tasks/launch-checklist.md` line 17 |
| Remove `RESEND_SANDBOX_TO` on Production | `docs/13-notifications.md` |
| Stripe Checkout Playwright E2E | Env-gated; `tasks/sprint-12-operations-growth.md` |

---

## Backlog P2 (no sprint — promote when needed)

- Service-area zip/radius enforcement
- Branding colors on booking page
- Editable `publicSlug`
- Provider Open Jobs self-claim
- Providers Activity kanban
- iCal feed / Zapier app
- Per-template email copy editing
- Promo codes / gift cards
- Multi-location, native apps, website builder

See `tasks/backlog.md`.

---

## Validation matrix (by phase)

| Phase | Key smokes |
|-------|------------|
| 3 | `smoke:business-profile`, `smoke:address-autocomplete`, `smoke:launch-onboarding` |
| 4 | `smoke:reports`, `smoke:crm-lists`, `smoke:manual-booking`, `smoke:customer-portal`, `smoke:scheduler` |
| 5 | `smoke:dashboard`, `smoke:reports` |
