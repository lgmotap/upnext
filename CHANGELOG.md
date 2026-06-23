# Changelog

All notable changes to UpNext are documented here. Format loosely follows Keep a Changelog.

## [Unreleased]
### Added
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

### Changed
- Auth pages (`/sign-in`, `/sign-up`, `/forgot-password`) wired to Supabase server actions; sign-up provisions org + business profile and now redirects new accounts to `/app/onboarding`.
- `prisma.config.ts` loads `.env.local` then `.env` (Next-style precedence) so `vercel env pull` feeds both Next and Prisma.
- Upgraded stack target to **Prisma 7** (`prisma-client` generator, `prisma.config.ts`, `@prisma/adapter-pg`, `generated/prisma/`); Node pinned to 22 (`.nvmrc`).

### Notes
- Marketing landing page at `/` is unchanged.
- Local env lives in `.env.local` (gitignored); public Supabase vars also set in Vercel for all environments. 3 secrets still needed: `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `DIRECT_URL`. See `HANDOFF.md`.
- Supabase DB already migrated (`init_auth_and_business`). RLS currently disabled — see `HANDOFF.md`.
- Stripe integration deferred to payments sprint.
