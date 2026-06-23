# Sprint 01 — Auth + Business Setup
- [x] Supabase Auth (sign up / sign in / forgot password)
- [x] Organization + Membership models and creation on signup
- [x] Business profile (name, slug, timezone, currency, contact, service area, logo) — core fields on signup; settings UI still mock
- [x] Onboarding wizard → ends on shareable booking page URL (`/app/onboarding`)
- [x] Server-side session + membership guard for /app/*

## Onboarding wizard — notes
- Files: `app/app/onboarding/*`, `server/validators/onboarding.ts`,
  `server/services/business.ts`, `server/actions/onboarding.ts`,
  `server/permissions/can.ts`. Sign-up now redirects new accounts to `/app/onboarding`.
- Persists to existing models (Organization name/timezone/currency + BusinessProfile
  serviceArea/phone/description). Service + availability steps arrive in Sprint 02 with
  those models.
- Verified: compiles/builds; unauthenticated `/app/onboarding` redirects to
  `/sign-in?next=…`. **End-to-end form submit needs real DB env** (3 secrets in `.env.local`).
