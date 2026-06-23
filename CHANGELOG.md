# Changelog

All notable changes to UpNext are documented here. Format loosely follows Keep a Changelog.

## [Unreleased]
### Added
- Product app scaffolding under `/app/*` (dashboard, bookings, calendar, jobs, customers, team, services, payments, settings).
- Public booking page `/book/[businessSlug]`, mobile crew view `/crew`, auth screens.
- Product documentation in `docs/`, AI build config in `.cursor/` and `.claude/`, sprint tasks in `tasks/`.
- Pluto-inspired green UI shell on mock data (no backend yet).

### Notes
- Marketing landing page at `/` is unchanged.
- Backend (Prisma, auth, Stripe, email) intentionally deferred to later sprints.
