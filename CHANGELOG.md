# Changelog

All notable changes to UpNext are documented here. Format loosely follows Keep a Changelog.

## [Unreleased]
### Added
- **Booking confirmation calendar picker**: “Add to calendar” opens a modal with Google Calendar, Outlook, and Apple Calendar (.ics download); shared `buildCalendarLinks` helper. `npm run smoke:calendar-links`.
- **Sprint 36 onboarding & address UX**: `AddressAutocompleteFields` (Google Places when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` set, manual fallback otherwise) on onboarding, settings, and public booking; `IndustryTypeCards` on onboarding step 1; sign-up business name dedup via Option A helper on step 3. `docs/architecture/google-maps.md`. `npm run smoke:address-autocomplete`.
- **Sprint 35 company profile parity**: shared `ServiceAreaFields` (onboarding + settings), logo upload to Supabase Storage (`business-logos` bucket), `websiteUrl` on profile, public booking logo + website link. `npm run smoke:business-profile`.
- **App shell parity**: header notification bell (pending bookings + recent activity), profile dropdown (settings, billing/API for owners, sign out), Communications in sidebar nav.
- **Sprint 37 reports v2**: date range picker on `/app/reports`, range stats + CSV export (owner/admin). `npm run smoke:reports`.
- **Sprint 38 CRM customer depth**: customer detail tabs (Overview, Jobs, Addresses, Notes, Payments), tag edit + list filter, per-customer comms link/filter. `npm run smoke:crm-lists`.
- **Sprint 39 bookings inbox scale**: history pagination (50/page), status/search/date filters, pending cap + show-all, bulk decline on pending cards. `npm run smoke:crm-lists`.
- **Sprint 40 manual booking parity**: custom booking fields, payment section (bill later vs Stripe), review panel, multi-address picker. `npm run smoke:manual-booking`, `smoke:custom-booking-fields`.
- **Sprint 41 calendar month + conflicts**: Week/Month toggle on `/app/calendar`, month density grid, worker overlap warnings, pending request chips. `npm run smoke:scheduler`.
- **Sprint 43 dashboard ops parity**: four queue KPIs with deep links (booked/scheduled today, awaiting payment, unassigned), header CTAs, enriched today rows, crew activity in feed; jobs/payments list filters. `npm run smoke:dashboard`.
- **Sprint 44 dashboard analytics snapshot**: time-aware greeting, `BusinessSnapshot` (30-day metrics) when Getting Started complete; shared `lib/reporting/period-stats.ts`.
- **Settings → Business rework (partial)**: sectioned profile form (industry, address, service area coverage + preview, public fields); fixed `businessSettingsSchema` so save no longer requires onboarding-only fields.
### Fixed
- **Manual booking address picker**: derive default service address in render instead of `useEffect` setState (fixes `react-hooks/set-state-in-effect` lint).
- **Dashboard KPI deep links**: `?status=pending` on payments now shows pending + overdue (matches KPI count); **Booked today** links to `?status=accepted&range=today`; crew activity dedupe uses stable keys. `Avatar is not defined` on dashboard — dedicated `UserAvatar` client component; initials from name/email; optional photo from `User.avatarUrl` or Supabase metadata.
- **Settings → API**: removed duplicate page header and tab bar (layout already provides them).
- **Sprint 34 jobs pagination**: jobs list 50/page + `ListPagination`.
- **Sprint 32 CRM list UX**: customers table with search, sort, pagination (50/page), last job column; bookings hybrid inbox (pending cards + history table); shared `ListPagination`. `npm run smoke:crm-lists`. `/app/calendar/scheduler` day board with HTML5 drag-drop, worker columns, unassigned sidebar; `rescheduleJobFromSchedulerAction`. `npm run smoke:scheduler`.
- **Sprint 30 custom booking fields**: `BookingFormField` model, `/app/settings/booking-form`, public form dynamic fields, booking/job detail display, `GET /api/v1/custom-fields`. `npm run smoke:custom-booking-fields`.
- **Sprint 29 SMS notifications**: Twilio integration (mock without env), SMS toggles on notifications settings, mirrored OTW/late/24h triggers, `NotificationLog.channel`. `docs/architecture/notifications.md`. `npm run smoke:sms`.
- **Sprint 28 crew & field polish**: Google Maps embed on crew job detail, same-day ETA selector for running late, dash-separated service line on job views.
- **Sprint 27 API v1 expansion**: `availability`, `extras`, `categories`, `frequencies`, `company`, `settings` endpoints; `booking_canceled` webhook. `docs/api-v1-read.md`.
- **Sprint 26 portal auth & FAQ**: optional `portalPasswordLoginEnabled` with Supabase portal users (`Customer.portalUserId`); forgot/reset password flow; `portalFaqJson` editor + Book again accordion; cleaning FAQ defaults. `npm run smoke:portal-password`, `npm run smoke:portal-faq`.
- **Sprint 25 custom booking domain**: `customBookingHost` + verified routing via `proxy.ts`; Settings → Portals DNS UI; profile-aware booking URLs. `npm run smoke:custom-domain`.
- **Sprint 24 pay at booking (optional)**: `payAtBookingEnabled` + `requirePaymentAtBooking` on `BusinessProfile`; Stripe Checkout step on public booking; manual “Collect payment now”; webhook auto-accepts booking → job. Off by default. `npm run smoke:pay-at-booking`.
- **Sprint 23 pricing params expansion**: `half_bathrooms` + `square_feet` on `PricingParameterType`; residential cleaning catalog defaults; services editor for all four params; public + manual booking + job price. `npm run smoke:pricing-params`, `npm run smoke:bed-bath-form-defaults`.
- **Sprint 22 scheduling depth**: buffer between jobs, provider carry-over on slot engine, per-service frequency discounts (public + manual booking + job price), settings UI. `npm run smoke:scheduling-depth`.
- **Phase 2 P1 sprint plans** (sprints 22–31): scheduling depth, pricing expansion, pay-at-booking, custom domain, portal auth, API expansion, crew polish, SMS, custom fields, dispatch scheduler. See `tasks/full-product-roadmap.md`.
- **Sprint 17 CRM import**: `/app/customers/import` CSV upload, dedupe by email. `npm run smoke:customer-import`.
- **Sprint 18 per-worker availability**: `MembershipAvailabilityRule`, org/worker hour intersection, team hours UI, crew read-only hours, manual booking slot filter. `npm run smoke:worker-availability`.
- **Sprint 19 parity hardening**: `docs/audits/browser-checklists.md`, `docs/audits/competitor-positioning.md`, lint fixes, `tests/e2e/full-product-flow.spec.ts`, `npm run test:e2e:full`.
- **Sprint 20 read API + webhooks**: `/app/settings/api`, `GET /api/v1/*`, outbound webhooks + delivery log. `npm run smoke:api`.
- **Sprint 14 recurring jobs**: `JobSeries` model, daily cron `/api/cron/recurring-jobs`, owner pause/cancel on job detail, `recurring_job_scheduled` email. `npm run smoke:recurring`. See `docs/16-recurring-jobs.md`.
- **Sprint 15 pricing parameters**: bed/bath surcharges on services, public + manual booking, residential cleaning catalog defaults. `npm run smoke:pricing-params`. See `docs/17-pricing-parameters.md`.
- **Sprint 16 portal cancel**: `minNoticeHours` policy, fix accepted-booking cancel, pause recurring series. `npm run smoke:portal-cancel`.
- **Sprint 16 saved cards**: Stripe Customer on `Customer`, portal add/list cards, pay with saved card. `npm run smoke:portal-saved-card`. See `docs/18-portal-saved-cards.md`.
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
