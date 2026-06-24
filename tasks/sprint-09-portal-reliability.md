# Sprint 09 — Portal reliability & booking link

> Fix broken owner UX before building customer portal. Reference: `tasks/post-beta-roadmap.md`, `docs/portal-review-qa.md`.

## Booking link (P0 — user-reported)

- [x] Centralize `getPublicAppUrl()` + `getBookingPageUrl(slug)` in `lib/url/app.ts`
- [x] `BookingLinkCard` — visible URL, copy, open preview, embed snippet (`iframe` → `/book/[slug]`)
- [x] Replace ad-hoc URL building on dashboard, business settings, customers, onboarding
- [x] Warn when `NEXT_PUBLIC_APP_URL` is localhost on non-dev deploy
- [x] Fix Getting Started “Share booking link” — mark done after onboarding (link shown step 4)
- [x] Settings **Portals** tab — booking link card + customer portal section (links to sprint 10)

## Component audit (owner app)

- [x] Sidebar “View booking page” uses real slug (already fixed — verify)
- [ ] Customer detail “Book again” → prefilled `/book/[slug]?...` when customer id known (partial — sprint 10)
- [ ] Job detail payment link button — verify with Stripe env
- [ ] Reschedule modals — browser verify on `/app/jobs/[id]` and pending bookings
- [ ] Services “Load suggested catalog” — verify for orgs with 1 service

## Smoke & docs

- [x] `npm run smoke:portal-links` — URL helper + slug resolution
- [x] Update `docs/08-routes-and-navigation.md` — Portals settings route
- [x] Update `HANDOFF.md` — sprint 09 status

## Out of scope (sprint 10+)

- Customer portal auth + dashboard tabs (landing stub at `/my/[slug]` only)
- Booking frequency step
- Recurring jobs
