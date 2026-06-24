# Sprint 16 — Customer portal depth

> CL: `customer-portal.md` — cancel upcoming, saved payment methods.

## Portal cancel

- [x] Customer can cancel upcoming booking/job from portal (policy: before X hours — use `minNoticeHours` from BusinessProfile)
- [x] Owner notified; job status cancelled; series paused if applicable
- [x] `npm run smoke:portal-cancel`

## Saved payment methods

- **Saved payment methods** — Stripe Customer per org customer (`Customer.stripeCustomerId`); portal **Add card** via Checkout `setup` mode; pay outstanding with saved card via PaymentIntent + Connect destination charge.
- [x] Stripe Customer per org+customer email
- [x] Portal Payments tab — add card (SetupIntent), list cards, pay outstanding with saved card
- [x] No card data on UpNext servers

## Optional (defer if blocked)

- [ ] Password login alternative to magic link — **defer** unless PO requests

## Validation

- [x] `npm run smoke:customer-portal` extended
- [x] `npm run smoke:portal-saved-card` (saved card path when keys present)
