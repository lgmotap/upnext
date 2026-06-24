# Customer portal — saved payment methods

Customers can save a card and pay outstanding balances from `/my/[slug]/dashboard` → **Payments**.

## Flow

1. Business must have **Stripe Connect** enabled (`Settings → Billing`).
2. Customer signs in via magic link.
3. **Add card** — redirects to Stripe Checkout (`mode: setup`); card attaches to a platform Stripe Customer.
4. **Pay with saved card** — server creates a destination-charge `PaymentIntent` on the platform account; funds transfer to the connected account.

## Data

- `Customer.stripeCustomerId` — platform Stripe Customer (metadata: `organizationId`, `customerId`).
- No card numbers stored in UpNext.

## Webhooks

Add `payment_intent.succeeded` to your Stripe webhook endpoint (alongside `checkout.session.completed`).

## Smokes

```bash
npm run smoke:portal-saved-card   # requires STRIPE_SECRET_KEY
npm run smoke:customer-portal
```
