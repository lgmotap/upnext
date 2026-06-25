# Sprint 25 — Custom booking domain (implementation)

> CL: Domains + NS delegation · `docs/custom-booking-domain.md` (sprint 21 doc-only).  
> Goal: `book.customer.com` serves `/book/{slug}` without redirect hop.

## Schema

- [x] `BusinessProfile.customBookingHost` — e.g. `book.acme.com` (unique index, nullable)
- [x] `BusinessProfile.customBookingVerifiedAt` — set after DNS/host probe succeeds (optional)

## Routing

- [x] `middleware.ts` — if `Host` matches org `customBookingHost` → rewrite to `/book/[publicSlug]` (root path)
- [x] Embed path: `book.acme.com/embed` → `/book/[slug]/embed`
- [x] App host (`upnext.app`) unchanged — slug URLs still work

## Owner UI

- [x] `/app/settings/portals` or Business tab — enter custom host, copy CNAME instructions
- [x] “Verify DNS” button — HEAD request or Vercel domain API check (best-effort)
- [x] Warning when `NEXT_PUBLIC_APP_URL` host ≠ custom host (email link mismatch)

## Email & links

- [x] `lib/urls/booking.ts` (or existing helper) — prefer custom host in confirmation emails when verified
- [x] Payment links use same host policy

## Validation

- [x] `npm run smoke:custom-domain` — mock Host header in integration test
- [x] Update `docs/custom-booking-domain.md` with implemented flow
- [x] Manual: Vercel domain + CNAME on staging project
