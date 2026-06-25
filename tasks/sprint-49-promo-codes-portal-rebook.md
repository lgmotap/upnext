# Sprint 49 — Promo codes / gift cards on portal rebook

> **Status:** 📋 Planning (not started)  
> **Phase:** 6 (P2 post-parity)  
> **Backlog:** `tasks/backlog.md`  
> **ADR:** Deferred in `docs/adr/0005-mvp-scope-boundaries.md` and `docs/12-payments-and-billing.md`  
> **Depends on:** Sprint 42 portal rebook, sprint 24 pay-at-booking, Stripe Connect

---

## Current state

| Capability | UpNext today |
|------------|--------------|
| Portal Book Again | Prefill public booking via query params (sprint 42) |
| Frequency discounts | `ServiceFrequencyDiscount` on booking flows |
| Promo / gift cards | **Not built** — ADR out of MVP scope |
| Stripe | Connect charges + Checkout for pay-at-booking + portal saved cards |

## Planning goals

1. **Promo codes only v1** vs gift cards (gift cards = stored value + liability — heavier)
2. Stripe **Coupons/Promotion Codes** vs custom DB + manual discount math
3. Where redeemable: public book · portal rebook · manual booking · pay-at-booking step
4. Stack with frequency discounts? (recommend: one discount type wins)

## Scope (TBD)

### Data model (if custom)

- [ ] `PromoCode` — code, percent or fixed off, expiry, max redemptions, org scoped
- [ ] `PromoRedemption` — audit trail

### Owner UI

- [ ] Settings → Billing or Services → Promo codes CRUD
- [ ] Active/inactive, usage count

### Customer flows

- [ ] Promo field on public booking payment/summary step
- [ ] Portal rebook passes or accepts `?promo=` 
- [ ] Adjust `bookingPriceCents` / Stripe Checkout line item

### Server

- [ ] Validate promo server-side on submit (never trust client discount)
- [ ] Idempotent redemption per booking

### Tests & docs

- [ ] `scripts/smoke-promo-codes.ts` (Stripe test mode)
- [ ] ADR 0007 update if gift cards in scope
- [ ] Update `docs/12-payments-and-billing.md`

## Out of scope (v1 recommendation)

- Gift cards / stored balance (defer to 49.1 unless PO requires)
- Referral program credits
- Auto-apply promos from marketing campaigns

## Validation

- [ ] Stripe test keys required for full smoke
- [ ] `npm run smoke:pay-at-booking` regression

## Open questions (PO)

1. Promo only for v1, or gift cards mandatory?
2. Stripe-native promotion codes vs UpNext-managed?
3. Owner-created codes only, or customer-specific one-time codes?
