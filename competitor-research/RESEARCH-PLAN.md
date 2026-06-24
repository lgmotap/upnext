# ConvertLabs deep teardown plan

Maximum-detail, phased competitor research for UpNext. Execute in order. Each phase ends with: update `page-registry.json` → crawl → review → `discovery-notes.md` → regenerate reports.

**Target:** [ConvertLabs](https://convertlabs.io/) — home-service booking, scheduling, payments, portals, marketing, website builder.

**Surfaces to cover:**

| Surface | Access |
|---------|--------|
| Marketing site | Public |
| Help center (`help.convertlabs.io`) | Public |
| Owner/admin dashboard (`convertlabs.io/dashboard` or app URL) | Trial account |
| Customer portal (`{subdomain}.convertlabs.io`) | Create on trial or use demo |
| Provider mobile app | iOS/Android + magic-link login |
| Public booking widget / website | Trial business slug |

---

## Phase 0 — Setup (Day 1)

- [ ] Create free trial (no card if offered) with a realistic business name (e.g. "UpNext Research Co").
- [ ] Record trial email, subdomain choice, and plan tier in `targets/convertlabs/discovery-notes.md` (local).
- [ ] Run `npm run research:init -- --target convertlabs` (copies `page-registry.example.json` locally).
- [ ] Run `npx playwright install chromium`.
- [ ] Run Phase 1 crawl to verify tooling.

**Manual discovery (1–2 hours, Cursor Browser or Chrome):**

- Click every top-level nav item once; note SPA routes vs full page loads.
- Open user menu (profile, billing, logout).
- Note plan badge / upgrade prompts / lock icons.
- Export a rough nav tree into `discovery-notes.md` before automating.

---

## Phase 1 — Public marketing & positioning

**Goal:** Understand how they sell, what they promise, plan differentiation.

**Pages:** Home, Features (all sub-pages), Pricing, Industry pages, Sign up, Sign in, Integrations marketing, Mobile app marketing, Blog/resources if present.

**Capture:**

- Hero value props, social proof, FAQ
- Feature bullets vs deep feature pages
- Pricing tiers, limits (providers, revenue cap, storage, seats)
- Trial terms (card required?, duration)
- Comparison tables, "included in every plan" lists

**Report sections:** `pricing-and-limits.md`, start `feature-inventory.md` (marketing claims).

---

## Phase 2 — Help center & documentation

**Goal:** Feature inventory from their own docs — often more complete than the UI.

**Start:** `https://help.convertlabs.io/en/` — crawl category index and every article linked from:

- Getting started / onboarding
- Bookings & scheduling
- Services & pricing
- Customers
- Team & service providers
- Payments & payouts
- Notifications (email/SMS)
- Website & booking widget
- Customer portal
- Service provider app
- Integrations (Zapier, NiceJob, etc.)
- Settings (every settings article)

**Method:** Add each article URL to registry with `source: help-center`. Extract structure + full text sample.

**Report sections:** `feature-inventory.md`, `integrations-map.md`, `forms-and-fields.md` (from doc screenshots/descriptions).

---

## Phase 3 — Signup & onboarding

**Goal:** Map first-run experience and time-to-first-booking.

**Flow steps (registry `flows/onboarding-owner`):**

1. Sign up form — every field, validation, plan selection
2. Post-signup wizard steps (company info, industry, timezone, services pre-load)
3. Website/template picker if shown
4. First dashboard landing — empty states, CTAs, checklist
5. "Go live" / publish booking page moment

**Capture:** Each step = separate page entry + screenshot. Note defaults they pre-fill.

**Report sections:** `user-flows.md` (onboarding), `forms-and-fields.md`.

---

## Phase 4 — Owner dashboard & global navigation

**Goal:** Complete nav map — every sidebar item, tab, and sub-route.

**Method:**

1. Manual pass: expand all nested menus, open every tab.
2. Add each route to registry under `phase-04-owner-nav`.
3. Crawl with `owner` storage state.
4. For each page: primary actions, filters, table columns, empty states, bulk actions.

**Document:**

- Global search if present
- Notification center
- Quick-create buttons (+ Booking, + Customer, etc.)
- Breadcrumbs and page titles

**Report sections:** `navigation-map.md`, `page-map.md`.

---

## Phase 5 — Bookings & scheduling (deep)

**Goal:** Core operational workflow — their validated heart.

**Sub-areas:**

| Area | What to document |
|------|------------------|
| Booking list/inbox | Columns, filters, statuses, bulk actions |
| Booking detail | Status transitions, assign providers, notes, timeline |
| Create booking (admin) | Form fields, service selection, recurrence |
| Calendar / scheduler | Views (day/week/month), drag-drop, conflicts |
| Public booking flow | Service picker, add-ons, address, slot selection, payment |
| Recurring jobs | Rules, edit series vs single |
| Cancel / reschedule | Policies, fees, customer vs admin |
| Auto-charge / card holds | When triggered, settings |

**Flows to script in registry:**

- `flow-admin-create-booking`
- `flow-accept-incoming-request`
- `flow-reschedule`
- `flow-cancel`
- `flow-public-book-customer`

**Report sections:** `user-flows.md`, `forms-and-fields.md`, `feature-inventory.md`.

---

## Phase 6 — Services, catalog & availability

- Service list CRUD — name, duration, price, description, visibility
- Add-ons / extras
- Categories or grouping
- Pricing models (flat, hourly, from-price)
- Availability rules — weekly hours, buffers, lead time, blackout dates
- Service area / zones if present

---

## Phase 7 — Customers & CRM

- Customer list — search, filters, columns
- Customer profile — bookings history, addresses, payment methods, notes, tags
- Import customers
- Referral program (portal)
- Communication log if present

---

## Phase 8 — Team, roles & permissions

**Roles to obtain access for (separate storage states):**

| Role | How |
|------|-----|
| Owner | Trial signup |
| Admin | Invite from team settings |
| Staff / dispatcher | If distinct from admin |
| Service provider | Invite + mobile app magic link |

**Per role, crawl:**

- Same nav — diff what's visible/hidden
- Actions disabled vs missing vs upgrade-locked
- Provider app: jobs list, job detail, clock in/out, checklist, photos, availability

**Report sections:** Permission matrix in `feature-inventory.md`, `user-flows.md` (provider day).

---

## Phase 9 — Payments, invoicing & billing

**Product billing (your subscription to ConvertLabs):**

- Settings → billing, plan change, invoices

**Customer payments (their product feature):**

- Stripe connection flow
- Payment at booking vs after job
- Auto-charge, deposits, card holds
- Payouts / provider compensation if shown
- Receipts, refunds

**Report sections:** `pricing-and-limits.md`, `forms-and-fields.md`.

---

## Phase 10 — Notifications & communications

- Email templates list — triggers (booking confirmed, reminder, etc.)
- SMS settings and templates
- Per-audience toggles (customer, provider, admin)
- Marketing campaigns (email) — if on trial tier, note locked state

---

## Phase 11 — Website builder & embeddable booking

- Site editor — pages, sections, templates
- Domain connection
- Booking widget / embed code
- Lead capture forms
- SEO / meta settings

---

## Phase 12 — Integrations & automation

- Integrations settings page — each connector
- Zapier triggers/actions (from help docs + UI)
- Webhooks (Enterprise gate?)
- iCal sync
- Review tools (NiceJob, etc.)

**Report sections:** `integrations-map.md`.

---

## Phase 13 — Customer portal

**URL:** `https://{your-subdomain}.convertlabs.io`

- Login / password reset
- Dashboard — upcoming, history
- Rebook, reschedule, cancel UX
- Payment methods
- Referral UI
- Branding (logo, colors)

Capture as `role: customer-portal` (may need separate session or public login).

---

## Phase 14 — Provider mobile app

**Cannot fully automate App Store app in Playwright.** Hybrid approach:

1. Document from [App Store listing](https://apps.apple.com/us/app/convertlabs-providers/id6743195733) + help articles.
2. Install on device; screenshot each screen to `targets/convertlabs/screenshots/mobile/`.
3. Log in via magic link from trial dashboard.
4. Manual checklist in `discovery-notes.md`:

- Job list, filters, statuses
- Job detail fields
- Clock in/out + geo
- Checklist completion
- Photo upload
- Availability calendar
- Push notification triggers
- Payout display

---

## Phase 15 — Settings exhaustive map

Open **every** settings tab/sub-tab:

- Business profile, timezone, currency
- Booking policies (cancellation, lead time)
- Portals (customer subdomain)
- Notifications (all sub-sections)
- Payments
- Team
- Services defaults
- Branding
- Integrations
- Billing / plan
- Data export / account deletion

Each sub-tab = registry page entry.

**Report sections:** `navigation-map.md` (settings tree), `forms-and-fields.md`.

---

## Phase 16 — Locked, gated & upsell features

**Goal:** Map what requires upgrade — shapes MVP parity vs post-MVP.

For each locked item record:

- Where it appears (nav, banner, modal)
- Minimum plan advertised
- Is it essential for core workflow or adjacent (marketing, multi-location)?

**Report sections:** `pricing-and-limits.md`, `gap-analysis.md`.

---

## Phase 17 — Synthesis (human)

Automation produces drafts. You finalize:

| Report | Owner |
|--------|-------|
| `page-map.md` | Auto + verify |
| `navigation-map.md` | Auto + verify |
| `feature-inventory.md` | Auto + categorize P0/P1/P2/W |
| `user-flows.md` | Mostly human |
| `forms-and-fields.md` | Auto + verify |
| `integrations-map.md` | Auto + help center |
| `pricing-and-limits.md` | Human |
| `gap-analysis.md` | Human — map to UpNext MVP |
| `upnext-mvp-recommendations.md` | Human — wedges, not copy list |

**Parity tags (use in gap analysis):**

- **P0** — MVP parity (`docs/02-mvp-scope.md`)
- **P1** — Validated, post-MVP
- **P2** — Out of scope / intentionally different
- **W** — Wedge — beat them here

---

## Phase 18 — UpNext cross-check

Compare synthesis to current UpNext routes:

- `/app/*` — dashboard, bookings, jobs, calendar, customers, services, team, settings
- `/book/[slug]` — public booking
- `/crew` — field view

Mark: **have**, **partial**, **missing**, **better**, **defer**.

Do **not** build features in this phase — output prioritized backlog only.

---

## Registry hygiene

- One `id` per unique URL + role + viewport (e.g. `owner-dashboard-bookings-list-desktop`).
- Add `discoveredFrom` when you find pages during manual pass.
- Re-crawl phases after registry updates; scripts skip unchanged pages unless `--force`.
- Default crawl delay: 2s between pages (configurable).

## Estimated effort

| Phases | Time |
|--------|------|
| 0–2 (public + docs) | 1–2 days |
| 3–8 (core product) | 3–5 days |
| 9–15 (settings, portals, mobile) | 2–4 days |
| 16–18 (synthesis) | 1–2 days |

**Total:** ~1–2 weeks for maximum detail with one researcher and trial account.
