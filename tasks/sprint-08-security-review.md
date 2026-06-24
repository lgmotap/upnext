# Sprint 08 — Security review pass

**Date:** 2026-06-24  
**Scope:** MVP release standard (auth, tenant isolation, public endpoints, payments)

## Checklist

| Control | Status | Notes |
|---------|--------|-------|
| Tenant isolation on server actions | PASS | All actions use `getAppSession()` + org-scoped queries |
| RBAC deny-by-default | PASS | `server/permissions/can.ts` + `job-access.ts` |
| Workers scoped to assigned jobs | PASS | `requireJobAccess` on crew + job mutations |
| Public booking rate-limited | PASS | `submitPublicBookingAction` uses `checkRateLimit` |
| Stripe webhook signature verified | PASS | `app/api/webhooks/stripe/route.ts` |
| No card data stored | PASS | Stripe Checkout only; PaymentRecord metadata |
| Client cannot set org/user IDs | PASS | IDs from session or validated server-side |
| Secrets not in browser bundle | PASS | `DATABASE_URL`, service role server-only |
| Manual booking authz | PASS | `canManageBookings` on `/app/bookings/new` |
| Notification prefs honored | PASS | Senders check `BusinessProfile` toggles |
| Cron protected | PASS | `CRON_SECRET` on `/api/cron/reminders` |
| RLS on tenant tables | PASS | See `HANDOFF.md`; Prisma uses direct connection |

## Findings (non-blocking for beta)

1. **AppSidebar business switcher** still reads `lib/mock/data.ts` — cosmetic; does not leak data.
2. **PostHog/Sentry** optional until env keys set — expected for local dev.
3. **Resend sandbox** redirects mail in dev — production requires domain verification (launch checklist).

## Verdict

**PASS** for MVP beta with documented production gates in `tasks/launch-checklist.md`.
