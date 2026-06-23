# UpNext Product — Claude guide

You are building **UpNext**, a production-grade SaaS for home-service businesses. This file governs the **product app** (under `/app/*`). The marketing landing page at `/` already exists and stays as-is unless explicitly asked.

## Read before major work
`docs/00-product-brief.md`, `docs/01-product-requirements.md`, `docs/02-mvp-scope.md`, `docs/06-architecture.md`, `docs/07-data-model.md`, `docs/10-auth-and-permissions.md`, `docs/11-booking-and-scheduling.md`, `docs/12-payments-and-billing.md`.

## Core product
Business setup · services & pricing · availability · online booking requests · jobs & scheduling · customers · team · mobile crew · payment tracking · notifications · dashboard & settings.

## MVP boundaries
Build the operations core. Do **not** build: website builder, email/SMS marketing, native apps, gift cards, promo codes, auto-charge/holds, multi-location, payouts, AI features.

## Implementation rules
TypeScript everywhere · business logic out of UI · DB access in repositories/services · validate all external input · authorize server-side · never trust client org/user/payment/job IDs · never expose secrets · typed validators · provider modules in `lib/*` · small focused files.

## Security
Deny by default · authenticate server-side · authorize every org-owned resource · validate & rate-limit public booking · verify Stripe webhook signatures · don't store card data.

## Non-stop build loop
Read docs → inspect code → short plan → smallest safe implementation → validate → fix → repeat → self-review → update docs → summarize how to test.
