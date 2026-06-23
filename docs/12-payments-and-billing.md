# Payments and Billing

Two **separate** payment concepts — never mix in code:
1. **Business payments** — customers → service business.
2. **SaaS billing** — business → UpNext.

## Business Customer Payments (MVP)
Manual status tracking · payment request link · Stripe payment link/Checkout · statuses paid/pending/overdue/failed/refunded.
Not in MVP: card-on-file, auto holds, auto-charge, gift cards, promo codes, automatic refunds.

## UpNext SaaS Billing
Stripe Billing. Plans: Free/Early Access · Solo · Team · Business.

## Stripe Rules
Webhooks are the source of truth; never activate paid access from a client redirect; verify signatures; store customer & subscription IDs; idempotent processing; never store raw card data.

## Payment Statuses
not_requested · pending · paid · overdue · failed · refunded.

## Later Roadmap
Deposits · card-on-file · auto-charge on completion · cancellation fees · same-day surcharges · promo codes · gift cards · refund management.
