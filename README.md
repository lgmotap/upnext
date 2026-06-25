# UpNext — Home-service booking OS

Booking, scheduling, CRM, crew, and payments for home-service businesses (cleaning, lawn, handyman, and more).

Stack: **Next.js (App Router) · TypeScript · Tailwind CSS v4 · Prisma 7 · Supabase · Stripe Connect · Resend**

**Node.js ≥ 20.19** required (Prisma 7). Use `nvm use` with `.nvmrc` (Node 22).

## Run locally

Secrets live in **Vercel** (not committed). Local dev uses `vercel env run`:

```bash
nvm use
npm install
npm run check:env:vercel   # must be all ✓ before dev
npm run dev                # http://localhost:3000 — or npm run dev:next (prisma generate + next)
```

Agent/stack docs: `AGENTS.md`, `HANDOFF.md`, `docs/architecture/database.md`.

## Product routes

| Surface | URL |
|---------|-----|
| Marketing | `/` |
| Owner app | `/app/*` |
| Public booking | `/book/[slug]` |
| Customer portal | `/my/[slug]` |
| Crew mobile | `/crew` |

## Deploy (Vercel)

1. Connect repo to Vercel; set env vars on Preview + Production (`npm run check:env:vercel`).
2. **Database** — Supabase Postgres; run migrations via `DIRECT_URL` (`npx prisma migrate deploy` in CI or locally).
3. **Crons** — `vercel.json`: reminder emails (`/api/cron/reminders`), recurring jobs (`/api/cron/recurring-jobs`), webhook retries (`/api/cron/webhook-retries`, daily on Hobby; use `*/15` on Pro). Requires `CRON_SECRET` bearer on cron routes.
4. **Stripe** — Connect Express + webhook at `/api/webhooks/stripe`; local: `npm run stripe:listen`.
5. **Resend** — Verify sending domain; set `EMAIL_FROM`; remove `RESEND_SANDBOX_TO` on Production (`docs/13-notifications.md`).
6. **Read API** — Owner creates keys at `/app/settings/api`; `GET /api/v1/bookings|customers|services` with `Authorization: Bearer unx_live_…`.

Custom booking domain guide: `docs/custom-booking-domain.md`.

## Validation

```bash
npm run db:validate && npm run typecheck && npm run build
npm run smoke:launch          # core product loop
npm run smoke:api             # read API + webhooks
npm run test:e2e              # Playwright (starts dev server)
```

## Where things live

| What | Where |
|---|---|
| Product app UI | `app/app/` |
| Public booking | `app/book/` |
| Server actions | `server/actions/` |
| Prisma schema | `prisma/schema.prisma` |
| Sprint tasks | `tasks/` |
| Marketing landing (optional) | `app/page.tsx`, `lib/config.ts` |

## Waitlist (legacy landing)

The root landing page can stay in waitlist mode or switch to launch — see `lib/config.ts` (`phase`, `cta`). Waitlist API: `app/api/waitlist/route.ts` (Postgres `WaitlistLead` + branded Resend thank-you email).
