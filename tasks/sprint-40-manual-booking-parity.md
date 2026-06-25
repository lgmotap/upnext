# Sprint 40 — Manual booking parity (payment step + custom fields)

> Closes practical gaps vs CL 10-tab wizard without cloning tab UI.  
> Audit: `docs/audits/product-gaps-roadmap.md` § Manual booking

## Current state

- `/app/bookings/new` — 5 sections in `ManualBookingClient.tsx`
- Pay at booking: `collectPaymentNow` checkbox when org toggle on
- Custom fields: sprint 30 — public booking only

## Scope

### Custom booking fields

- [x] Load org `BookingFormField` definitions on manual booking page
- [x] Render `CustomBookingFields` in notes/details section
- [x] Persist values on `BookingRequest` / job same as public flow
- [x] Show on job detail (`CustomFieldsDisplay` if not already)

### Payment step

- [x] When `payAtBookingEnabled` + Stripe connected: dedicated **Payment** section (not checkbox-only)
- [x] Options: “Bill later” vs “Collect payment now” (Stripe Checkout)
- [x] Match public booking copy and error handling

### Review step

- [x] Collapsible or final **Review** block before submit: customer, service, slot, total, worker, custom fields
- [x] No new route — inline confirmation panel

### Address for existing customer

- [x] If customer has multiple addresses: picker on manual booking (default address pre-selected)

## Out of scope

- Literal 10-tab wizard chrome (UX difference OK per parity audit)
- Quotes / invoice creation from manual book

## Validation

- [x] `npm run smoke:manual-booking`
- [x] `npm run smoke:custom-booking-fields` (manual path)
- [x] `npm run smoke:pay-at-booking` when Stripe configured
- [x] `npm run typecheck` + `npm run build`
