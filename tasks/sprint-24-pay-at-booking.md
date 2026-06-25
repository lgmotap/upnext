# Sprint 24 — Pay at booking (optional)

> CL: Public form Credit Card step · Settings → Payment.  
> **Product stance:** Off by default — payment link post-job remains default; toggle for operators who want CL parity.

## Schema & settings

- [x] `BusinessProfile.payAtBookingEnabled` — boolean, default `false`
- [x] `BusinessProfile.requirePaymentAtBooking` — when enabled, block submit without successful Checkout (optional sub-toggle)
- [x] `/app/settings/billing` — explain Connect required + link to toggle

## Public booking

- [x] After slot selection (before confirm): Payment step when `payAtBookingEnabled` && Stripe Connect active
- [x] Stripe Checkout `payment` mode — create `PaymentRecord` pending → confirm on webhook
- [x] Booking request `status` flow: payment failed → show `?error=` banner; success → confirmation
- [x] Skip payment step when toggle off (current behavior)

## Owner manual booking

- [x] Optional “Collect payment now” on manual booking when toggle on
- [x] Do not require payment tab when toggle off

## Webhooks & idempotency

- [x] Reuse `/api/webhooks/stripe` — map Checkout session to `BookingRequest` + `PaymentRecord`
- [x] Idempotent on webhook retry

## Validation

- [x] `npm run smoke:pay-at-booking` — env-gated Stripe; skip gracefully without keys
- [x] `npm run smoke:public-booking-parity` — still green with toggle off
- [x] Document positioning in `docs/audits/competitor-positioning.md`
