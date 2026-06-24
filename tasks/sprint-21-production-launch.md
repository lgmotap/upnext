# Sprint 21 — Production launch

> Final gates for a **full functional** production app.

## Email (owner action + verify)

- [ ] Resend domain verified — `tasks/launch-checklist.md` line 17
- [ ] `VERCEL_ENV_TARGET=production npm run check:resend:production`
- [ ] Remove `RESEND_SANDBOX_TO` on Production

## Custom booking domain (guide + optional impl)

- [ ] Doc: CNAME `book.customer.com` → Vercel / UpNext
- [ ] `NEXT_PUBLIC_APP_URL` + middleware host routing (if implementing — else doc-only)

## Production validation

- [ ] `VERCEL_ENV_TARGET=production npm run check:env:vercel`
- [ ] `npm run smoke:launch` against staging/preview with prod-like env
- [ ] Security review refresh — `tasks/sprint-08-security-review.md`

## Docs & handoff

- [ ] Update `README.md` — deploy, cron, Stripe, Resend
- [ ] `HANDOFF.md` — full product v1 complete
- [ ] All sprint 14–21 checkboxes `[x]`
