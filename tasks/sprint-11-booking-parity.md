# Sprint 11 — Public booking parity

> CL reference: `public-booking-standalone.md`, `onboarding-wizard.md` (embed link)

## Booking form steps (CL 10 sections → UpNext)

- [x] **Frequency** — One-time / Weekly / Bi-weekly / Monthly (`BookingRequest.frequency`)
- [x] Step indicator UI with dynamic numbering
- [x] Mobile layout pass on `/book/[slug]` (responsive padding, touch targets)
- [x] Error states per step (alert banner on form)
- [x] Confirmation page — add to calendar (ICS), business contact, portal link when enabled

## Prefill & deep links

- [x] Query params: `?email=&firstName=&lastName=&phone=&line1=&city=&region=&postalCode=`
- [x] Signed `?prefill=` token (sprint 10)
- [x] Customer detail “Book again” uses signed prefill

## Embed / share

- [x] `/book/[slug]/embed` — minimal chrome for iframe
- [x] Settings → Portals — embed code points to `/embed`
- [x] OG meta tags on booking page (`generateMetadata`)

## Service catalog on booking page

- [x] Group primary vs add-ons (separate sections)
- [x] Live duration + price total with frequency in summary
- [x] Empty state when no public services (`PublicBookingEmpty`)

## Smoke

- [x] `npm run smoke:public-booking-parity`
