# UpNext — Claude Code Guide

Read **`AGENTS.md`** and **`docs/architecture/ai-agent-rules.md`** before editing code.

**This project uses Prisma 7, not Prisma 6.** Do not downgrade Prisma or switch ORM without explicit owner approval.

## Product

UpNext is booking/scheduling/CRM/payments SaaS for home-service businesses (solo operators and teams of 2–50).

- Marketing: `/`
- Product app: `/app/*`
- Public booking: `/book/[slug]`
- Crew: `/crew`

## Architecture docs

- `docs/architecture/database.md` — Prisma 7, migrations, tenant isolation
- `docs/architecture/auth-and-permissions.md` — Supabase Auth + RBAC
- `docs/07-data-model.md` — entities
- `docs/02-mvp-scope.md` — MVP boundaries

## Build loop

Use `.claude/skills/upnext-feature-loop/SKILL.md`: read docs → plan → smallest safe change → validate → self-review → update docs.

## Database

- Prisma client: `@/generated/prisma/client`
- Singleton: `lib/db/prisma.ts` only
- Migrations: `DIRECT_URL` in `prisma.config.ts`; runtime: `DATABASE_URL` via `@prisma/adapter-pg`

@AGENTS.md
