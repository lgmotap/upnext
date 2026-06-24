# Sprint 12 — Operations & growth

> Post-first-customer parity: search, recurring, pricing params, full E2E.

## Global search (⌘K)

- [ ] Command palette component — search customers, jobs, bookings by name/email/address
- [ ] Keyboard shortcut `⌘K` / `Ctrl+K` on owner app layout
- [ ] Re-enable topbar search input (currently disabled “coming soon”)

## Recurring jobs

- [ ] `BookingRequest.frequency` → on accept, create `JobSeries` or flag next occurrence (minimal: store frequency + display; cron generates next booking request — not full CL engine)
- [ ] Owner manual booking frequency selector
- [ ] Public booking frequency → accepted flow

## Pricing parameters (wedge: keep simple)

- [ ] Optional service fields: `pricingNotes` or bed/bath count on booking form (flat price still default)
- [ ] Defer dynamic price matrix — document as Phase 3

## Payments depth

- [ ] Job detail — “Send payment link” always visible when Stripe connected
- [ ] Stripe Checkout E2E in Playwright when keys present
- [ ] Payment methods on file — Stripe Customer + portal tab (if not done in 10)

## E2E & hardening

- [ ] Playwright: sign-up → 4-step onboarding → full catalog → public book with addon → owner accept → assign → crew complete → mark paid
- [ ] RBAC regression — worker cannot hit `/app/*`
- [ ] Audit remaining “coming soon” UI — implement or remove

## Launch

- [ ] Re-run full `npm run smoke:launch` suite
- [ ] Resend prod domain (owner action) — `tasks/launch-checklist.md`
