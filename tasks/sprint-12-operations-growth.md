# Sprint 12 — Operations & growth

> Post-first-customer parity: search, recurring, pricing params, full E2E.

## Global search (⌘K)

- [x] Command palette — search customers, jobs, bookings by name/email/address
- [x] Keyboard shortcut `⌘K` / `Ctrl+K` on owner app layout
- [x] Re-enable topbar search input (opens palette)

## Recurring jobs

- [x] `BookingRequest.frequency` displayed on booking detail + manual booking selector
- [x] Owner manual booking frequency selector
- [x] Public booking frequency stored on accept flow (sprint 11)
- [ ] Full recurring cron / JobSeries — deferred Phase 3 (documented in post-beta-roadmap)

## Pricing parameters (wedge: keep simple)

- [ ] Optional bed/bath on booking form — deferred Phase 3
- [x] Flat price + frequency is MVP wedge (documented)

## Payments depth

- [x] Job detail — **Send payment link** when no PaymentRecord yet (Stripe connected)
- [ ] Stripe Checkout E2E in Playwright when keys present — manual / env-gated
- [ ] Payment methods on file — deferred sprint 12 (portal payments tab exists)

## E2E & hardening

- [x] Playwright: embed route + crew RBAC smoke
- [x] RBAC regression — worker `/app/*` blocked (existing); crew route e2e
- [x] Remove dead notifications bell (“coming soon”)

## Launch

- [x] `npm run smoke:global-search` + `npm run smoke:launch` (run in validation)
- [ ] Resend prod domain (owner action) — `tasks/launch-checklist.md`
