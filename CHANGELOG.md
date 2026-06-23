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

### Changed
- Auth pages (`/sign-in`, `/sign-up`, `/forgot-password`) wired to Supabase server actions; sign-up provisions org + business profile.
- Upgraded stack target to **Prisma 7** (`prisma-client` generator, `prisma.config.ts`, `@prisma/adapter-pg`, `generated/prisma/`).

### Notes
- Marketing landing page at `/` is unchanged.
- Copy `.env.example` → `.env.local` and fill Supabase + database URLs before running auth locally.
- Stripe integration deferred to payments sprint.
