# Changelog

All notable changes to UpNext are documented here. Format loosely follows Keep a Changelog.

## [Unreleased]
### Added
- **Sprint 14 recurring jobs**: `JobSeries` model, daily cron `/api/cron/recurring-jobs`, owner pause/cancel on job detail, `recurring_job_scheduled` email. `npm run smoke:recurring`. See `docs/16-recurring-jobs.md`.
- **Sprint 15 pricing parameters**: bed/bath surcharges on services, public + manual booking, residential cleaning catalog defaults. `npm run smoke:pricing-params`. See `docs/17-pricing-parameters.md`.
- **Sprint 16 portal cancel**: `minNoticeHours` policy, fix accepted-booking cancel, pause recurring series. `npm run smoke:portal-cancel`.
- **Full product roadmap**: `tasks/full-product-roadmap.md` (sprints 14→21).
- **Sprint 09 portal reliability**: `BookingLinkCard`, Settings → Portals, `npm run smoke:portal-links`.
- **Sprint 11 booking parity**: frequency step (one-time/weekly/bi-weekly/monthly), `/book/[slug]/embed`, query prefill params, confirmation ICS + portal link, OG meta. `npm run smoke:public-booking-parity`.
- **Sprint 10 customer portal**: magic-link `/my/[slug]`, dashboard (history, book again, payments), prefill on `/book/[slug]?prefill=`, owner **Send portal link**. `npm run smoke:customer-portal`.
- **Sprint 13 reporting v1**: `/app/reports` with revenue, jobs completed, weekly trend. `npm run smoke:reports`.
- **Browser audit fixes**: customer portal `isCustomerPortalEnabled`, calendar week label, `/my/` public routes.
- **Competitor parity audit**: `tasks/competitor-parity-audit-plan.md` (14 parts) + `tasks/competitor-parity-status.md` snapshot.
- **Industry service catalogs**: onboarding seeds full service + add-on lists per vertical (CL-style cleaning extras). `npm run smoke:industry-catalog`.
- **Portal batch 3**: Job + pending booking reschedule; crew On the way / Running late. `npm run smoke:scheduling`.
- **Portal batch 2**: Getting Started checklist, decline confirm modals, job assign/cancel, customer notes/address, calendar week nav, copy booking link.
- **Launch smokes**: `npm run smoke:launch` (+ onboarding, crew, payment scripts) automates launch-checklist core product flows.
- **Legal pages**: `/privacy` and `/terms` with footer links.
- **Sprint 08 beta hardening**: shared `ErrorFallback`, app-wide error boundaries, PostHog (`lib/posthog/*`) + Sentry (`instrumentation.ts`, optional DSN), Playwright e2e (`npm run test:e2e`), security review doc, skip-link + `:focus-visible` a11y.
- **Owner manual booking (Sprint 07)**: `/app/bookings/new` — pick/create customer, service, addons, slot; optional worker assign; creates accepted booking + scheduled job; `source=manual`; `npm run smoke:manual-booking`.
- **Notification settings (Sprint 07)**: six toggles persisted on `BusinessProfile`; honored by notification senders and reminder cron.
- **Sprint marathon mode**: `.cursor/rules/090-autonomous-sprint-execution.mdc`, `upnext-sprint-marathon` skill, and `stop` hook (`.cursor/hooks/sprint-marathon-continue.sh`) to auto-continue sprints 07→08→launch checklist without "should I continue?" prompts.
- **Dashboard (Sprint 07)**: `/app/dashboard` on real Prisma data — today's jobs, pending bookings, week revenue, outstanding payments, activity feed.
- **Team invite (Sprint 06)**: `TeamInvite` model; owner invites from `/app/team`; email with accept link; invite sign-up joins org as worker → `/crew`.
- **Job photos (Sprint 06)**: `JobPhoto` model + private `job-photos` Supabase bucket; crew upload (1–5 JPEG/PNG/WebP) on `/crew/jobs/[id]`; signed URLs on owner job detail.
- **Crew checklists (Sprint 06)**: `ChecklistTemplate` + `JobChecklistItem` models; per-service template editor on `/app/services`; checklist copied to jobs on accept; toggle completion on `/crew/jobs/[id]`; read-only on owner job detail.
- **Crew check-in timer (Sprint 06)**: `Job.checkedInAt` migration; check-in action on `/crew/jobs/[id]` with live elapsed timer; owner job detail shows time on site.
- **Sprint 06 started**: MVP traceability audit (`tasks/mvp-traceability.md`); sprint plans aligned with competitor research + codebase mock grep.
- **Booking detail** (`/app/bookings/[bookingRequestId]`): real Prisma data, accept/decline, job link, customer contact, price estimate.
- **Payments + notifications (Sprint 06)**: `NotificationLog` model; 8 email types wired (Resend + audit log); reminder cron at `/api/cron/reminders`; `npm run smoke:e2e` verifies logs.
- **Agent rules**: self-test requirement in `.cursor/rules/100-testing.mdc` and feature loop skill.
- Prisma 7 standardization: agent rules (`.cursor/rules/000-stack-prisma7-supabase.mdc`), `docs/architecture/*`, ADR 0006.
- `prisma.config.ts`, `@prisma/adapter-pg`, generated client at `generated/prisma/`.
- Product app scaffolding under `/app/*` (dashboard, bookings, calendar, jobs, customers, team, services, payments, settings).
- Public booking page `/book/[businessSlug]`, mobile crew view `/crew`, auth screens.
- Product documentation in `docs/`, AI build config in `.cursor/` and `.claude/`, sprint tasks in `tasks/`.
- Pluto-inspired green UI shell on mock data (no backend yet).
- Backend foundation: Prisma schema (User, Organization, Membership, BusinessProfile), Supabase Auth, `.env.example`, session proxy for `/app/*`.
- **Onboarding wizard** (`/app/onboarding`): validator → permission (`canManageBusiness`) → service (`updateBusinessSetup`) → server action; ends on the shareable booking-page URL.
- `server/permissions/can.ts` role checks; `server/services/business.ts`; `server/validators/onboarding.ts`.
- GitHub Actions **CI** (`.github/workflows/ci.yml`): Node 22, `db:generate` + typecheck + lint + build on PRs.
- `HANDOFF.md` — current status + how to continue (env, run, next steps).
- **Sprint 02 — Services + Availability**: `Service`, `AvailabilityRule`, `BlackoutDate` models; CRUD at `/app/services`; weekly hours, booking window, and blackouts at `/app/settings/availability`; public booking page loads real business profile and public services by slug.
- **Sprint 03 — Booking flow**: `Customer`, `CustomerAddress`, `BookingRequest` models; slot calculation from availability; public booking submit with rate limit; confirmation page; `/app/bookings` inbox with accept/decline.
- **Sprint 04 — Jobs + calendar + customers**: `Job` model; accept booking creates job; `/app/jobs`, `/app/calendar`, `/app/customers` on real data; `npm run smoke:e2e` integration test.
- **Sprint 05 — Team + crew**: `JobAssignment`; team list; assign jobs; `/crew` mobile view with worker-scoped access.
- **Booking UX**: month-grid calendar with navigation; primary service + optional add-ons (`Service.isAddon`, `BookingRequestAddon`).

### Changed
- Auth pages (`/sign-in`, `/sign-up`, `/forgot-password`) wired to Supabase server actions; sign-up provisions org + business profile and now redirects new accounts to `/app/onboarding`.
- `prisma.config.ts` loads `.env.local` then `.env` (Next-style precedence) so `vercel env pull` feeds both Next and Prisma.
- Upgraded stack target to **Prisma 7** (`prisma-client` generator, `prisma.config.ts`, `@prisma/adapter-pg`, `generated/prisma/`); Node pinned to 22 (`.nvmrc`).

### Notes
- Marketing landing page at `/` is unchanged.
- Local env lives in `.env.local` (gitignored); public Supabase vars also set in Vercel for all environments. 3 secrets still needed: `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `DIRECT_URL`. See `HANDOFF.md`.
- **Before production:** verify Resend sending domain on UpNext account (`docs/13-notifications.md`, `tasks/launch-checklist.md`).
- Supabase DB already migrated (`init_auth_and_business`). RLS currently disabled — see `HANDOFF.md`.
- Stripe: local keys + CLI webhook forwarding configured; see `docs/stripe-setup.md`. Vercel Stripe env + Dashboard webhook still needed at deploy time.
