# Stripe setup — UpNext (customer payments via Connect)

**Platform account (MCP verified):** UpNext sandbox (`acct_1TlQnfRAIBY6m6gR`)  
**Dashboard keys:** https://dashboard.stripe.com/test/apikeys

## Architecture

- **Businesses** connect via Express (`Settings → Billing → Connect Stripe`).
- **Customers** pay via Checkout **destination charge** on the platform account; funds transfer to the connected account.
- **Webhooks** on the **platform** account receive `checkout.session.completed` and `account.updated`.

## Local dev (two terminals)

### 1. Env (`.env.local`)

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # from stripe listen (see below)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Start app + webhook forwarding

```bash
# Terminal A
npm run dev:next

# Terminal B
npm run stripe:listen
```

Copy the `whsec_...` from Terminal B into `STRIPE_WEBHOOK_SECRET`, then **restart** Terminal A.

The signing secret changes each time you restart `stripe:listen`.

### 3. Connect platform profile

Stripe Dashboard → **Connect → Settings** — complete the platform profile before real Express onboarding.

### 4. Automated smoke tests

```bash
npm run smoke:e2e      # booking → job → payment record
npm run smoke:stripe   # Connect checkout + webhook route → paid
```

## Production / Vercel

1. Add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL` to Vercel (not set yet as of 2026-06-24).
2. Create a **Dashboard** webhook: `https://<your-domain>/api/webhooks/stripe`
3. Events: `checkout.session.completed`, `account.updated`
4. Use that endpoint’s signing secret as `STRIPE_WEBHOOK_SECRET` on Vercel (not the CLI `whsec`).

## Manual UI test flow

1. `npm run dev:next` + `npm run stripe:listen` with matching `STRIPE_WEBHOOK_SECRET`
2. Sign in as owner → **Settings → Billing** → **Connect Stripe** (complete Express test onboarding)
3. Accept a booking → open job → **Send payment link**
4. Pay with test card `4242 4242 4242 4242`
5. Confirm job payment status → **paid** (via webhook)

## What works without full Connect onboarding

- Manual **Mark paid** / **Mark overdue**
- `PaymentRecord` on every job
- `/app/payments` list
- Automated `npm run smoke:stripe` (uses test Connect account + signed webhook)

## Audit (2026-06-24)

| Check | Result |
|-------|--------|
| Stripe CLI | ✅ Installed (`brew install stripe/stripe-cli/stripe`) |
| `.env.local` keys | ✅ Set |
| Local webhook | ✅ `npm run stripe:listen` → `/api/webhooks/stripe` |
| Dashboard webhook endpoints | ⬜ None (use CLI locally; create Dashboard endpoint when deployed) |
| `npm run smoke:stripe` | ✅ Passes |
| Real org Connect onboarding | ⬜ Complete in app when testing UI payments |
