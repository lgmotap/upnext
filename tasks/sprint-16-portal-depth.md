# Sprint 16 — Customer portal depth

> CL: `customer-portal.md` — cancel upcoming, saved payment methods.

## Portal cancel

- [x] Customer can cancel upcoming booking/job from portal (policy: before X hours — use `minNoticeHours` from BusinessProfile)
- [x] Owner notified; job status cancelled; series paused if applicable
- [x] `npm run smoke:portal-cancel`

## Saved payment methods

- [ ] Stripe Customer per org+customer email
- [ ] Portal Payments tab — add card (SetupIntent), list cards, pay outstanding with saved card
- [ ] No card data on UpNext servers

## Optional (defer if blocked)

- [ ] Password login alternative to magic link — **defer** unless PO requests

## Validation

- [ ] `npm run smoke:customer-portal` extended
- [ ] `npm run smoke:stripe-payments` with saved card path when keys present
