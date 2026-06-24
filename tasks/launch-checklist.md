# Launch Checklist

Cross-check with `tasks/mvp-traceability.md` before beta.

## Core product
- [x] Onboard → add service → copy booking link → customer books — `npm run smoke:launch-onboarding`
- [x] Worker completes job on mobile (check-in timer + checklist + photos) — `npm run smoke:launch-crew`
- [x] Payment link sent / paid → status visible on job + dashboard — `npm run smoke:launch-payment` + `npm run smoke:stripe`
- [x] Accept booking → job created → worker assigned — `npm run smoke:e2e`
- [x] Owner manual booking (phone customer) works — `npm run smoke:manual-booking`

## Platform
- [x] Auth + permissions enforced (tenant isolation, RBAC — worker cannot access `/app/*`) — see `tasks/sprint-08-security-review.md`
- [x] Public booking validated + rate-limited — smoke:e2e + security review
- [x] Stripe webhooks verified + idempotent — code + `npm run smoke:stripe` when keys configured
- [x] Emails sending (Resend) + logged in NotificationLog — smoke:e2e (27+ sent in dev sandbox)
- [ ] **Resend domain verified on UpNext account** — `EMAIL_FROM` uses `@yourdomain.com`; `RESEND_SANDBOX_TO` removed on Preview/Production (see `docs/13-notifications.md` § Before production)
- [x] Errors handled; Sentry wired (set `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` on Vercel for live)
- [x] PostHog analytics wired (set `NEXT_PUBLIC_POSTHOG_KEY` on Vercel for live)
- [x] smoke:e2e + smoke:manual-booking cover booking → job paths (crew complete + Stripe payment E2E still manual)

## Legal / ops
- [x] Legal pages + privacy — `/privacy`, `/terms` (footer linked)
- [x] Production env vars on Vercel (Preview + Production) — `VERCEL_ENV_TARGET=production npm run check:env:vercel` ✓ (2026-06-24)
