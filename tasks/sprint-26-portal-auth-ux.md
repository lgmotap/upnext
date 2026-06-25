# Sprint 26 — Portal auth & rebook UX

> CL: `customer-portal.md` — email/password login, FAQ sidebar on Book Again.

## Password login (optional alternative to magic link)

- [x] `BusinessProfile.portalPasswordLoginEnabled` — default `false` (magic link remains default)
- [x] Portal login page: magic link **or** email + password when enabled
- [x] Supabase: `Customer.portalUserId` → Supabase user with `user_metadata.role = portal_customer` (no Membership)
- [x] **Decision:** lazy Supabase user on first magic link / owner invite when password login enabled; password setup via recovery email
- [x] Forgot password → Supabase reset email → `/my/[slug]/auth/recovery` → set password
- [x] Rate limit login attempts (reuse public rate limiter)

## Portal FAQ on Book Again

- [x] `BusinessProfile.portalFaqJson` — optional array `{ question, answer }` (max 8)
- [x] Owner editor in `/app/settings/portals` — simple list add/remove
- [x] Portal Book Again sidebar — accordion FAQ (CL pattern)
- [x] Seed 2–3 cleaning defaults when industry = cleaning

## Validation

- [x] `npm run smoke:customer-portal` — magic link path unchanged
- [x] `npm run smoke:portal-password` (new) — password path when enabled
- [x] `npm run smoke:portal-faq` — FAQ renders on book again
