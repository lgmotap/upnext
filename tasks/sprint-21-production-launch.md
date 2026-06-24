# Sprint 21 — Production launch

> Final gates for a **full functional** production app.

## Email (owner action + verify)

- [ ] Resend domain verified — `tasks/launch-checklist.md` line 17
- [ ] `VERCEL_ENV_TARGET=production npm run check:resend:production`
- [ ] Remove `RESEND_SANDBOX_TO` on Production

## Custom booking domain (guide + optional impl)

- [x] Doc: CNAME `book.customer.com` → Vercel / UpNext — `docs/custom-booking-domain.md`
- [x] `NEXT_PUBLIC_APP_URL` + middleware host routing (if implementing — else doc-only) — doc-only for MVP; redirect pattern documented

## Production validation

- [x] `VERCEL_ENV_TARGET=production npm run check:env:vercel` — verified 2026-06-24 per launch checklist
- [x] `npm run smoke:launch` against staging/preview with prod-like env
- [x] Security review refresh — `tasks/sprint-08-security-review.md` (Sprint 20 API keys hashed, tenant-scoped)

## Docs & handoff

- [x] Update `README.md` — deploy, cron, Stripe, Resend, API
- [x] `HANDOFF.md` — full product v1 complete (pending Resend domain owner action)
- [x] All sprint 14–21 checkboxes `[x]` except Resend production gates below
