# server/
Backend modules for the modular monolith. Business logic only — no UI here.
- `actions/` — server actions called from the UI
- `services/` — business logic
- `repositories/` — database access (Prisma)
- `validators/` — Zod schemas / input validation
- `permissions/` — RBAC + ownership checks (deny by default)
- `notifications/` — email (Resend) + future channels
- `billing/` — Stripe payments + SaaS subscriptions
- `jobs/` — background job handlers (reminders, etc.)
Wired in later sprints; the current UI shell uses mock data in `lib/mock/`.
