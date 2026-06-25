# Sprint 07 — Dashboard + Settings + Owner Booking

> Traceability: `tasks/mvp-traceability.md` — manual booking promoted from sprint 04.

## Dashboard (replace mock data)
- [x] Today's jobs count + list snippet
- [x] Pending booking requests count + link
- [x] New bookings this week
- [x] Revenue collected (paid PaymentRecords)
- [x] Outstanding payments count
- [x] Recent activity feed (last 10 events: bookings, jobs, payments)

## Owner manual booking (phone / walk-in)
- [x] `/app/bookings/new` — pick or create customer, service, addons, slot
- [x] Optional: assign worker on create
- [x] Creates booking request as accepted → job in one flow (or accept inline)
- [x] Source field: `manual` vs `public_booking`

## Settings polish
- [x] **Wire `/app/settings/business`** to BusinessProfile (replace mock; Save works)
- [x] Business settings: copy public booking link (reuse onboarding pattern)
- [x] **Follow-up sprint 35:** logo, website, unified service area with onboarding
- [x] Notifications settings: persist toggles per org; connect to sprint 06 senders
- [x] Billing settings: Stripe Connect status + link to onboarding
- [x] Empty / loading / error states on dashboard + settings
