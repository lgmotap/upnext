# AI Agent Rules

**This project uses Prisma 7, not Prisma 6.**

Every AI agent (Cursor, Claude Code, or other) must follow these rules. Read this file, `AGENTS.md`, and `.cursor/rules/000-stack-prisma7-supabase.mdc` before editing code.

## Mandatory reads

```txt
.cursor/rules/000-stack-prisma7-supabase.mdc
AGENTS.md
docs/architecture/database.md
docs/architecture/auth-and-permissions.md
docs/02-mvp-scope.md        (MVP boundaries)
docs/07-data-model.md       (entities)
```

## Hard rules

```txt
Do not downgrade Prisma to v6.
Do not change ORM without explicit owner approval.
Do not introduce Drizzle, TypeORM, Sequelize, or MongoDB.
Do not import Prisma in client components.
Do not bypass auth or organization permission checks.
Do not expose server secrets to the browser.
Do not rename Organization → Workspace without an approved migration plan.
Do not restructure to src/ unless explicitly requested (this repo uses root app/).
```

## Feature implementation order

```txt
1. Check existing schema and docs/07-data-model.md
2. Update prisma/schema.prisma only if needed
3. Create migration if schema changed (explain + ask before destructive changes)
4. npx prisma generate
5. Add Zod validation (server/validators/)
6. Add permission checks (server/permissions/)
7. Add repository/service/action
8. Add UI
9. Run: db:validate, typecheck, lint, build
```

## Stack summary

```txt
Next.js App Router
Supabase Auth + Postgres + Storage
Prisma 7 + @prisma/adapter-pg
TypeScript, Tailwind
```

## Paths agents must use

```txt
lib/db/prisma.ts              — only Prisma entry point
@/generated/prisma/client     — generated Prisma types/client
lib/supabase/client.ts        — browser
lib/supabase/server.ts        — server
server/actions/               — mutations from UI
server/permissions/           — session + RBAC
prisma/schema.prisma
prisma.config.ts
```

## Definition of done (database work)

```txt
[ ] Prisma 7 installed (not v6)
[ ] Generated client at generated/prisma/
[ ] lib/db/prisma.ts uses @prisma/adapter-pg + DATABASE_URL
[ ] prisma.config.ts uses DIRECT_URL for migrations
[ ] No Prisma imports in client components
[ ] Tenant queries scoped by organizationId
[ ] npm run db:validate passes
[ ] npm run typecheck && npm run lint && npm run build pass
```

## MVP scope reminder

Do not build: website builder, marketing automation, native apps, gift cards, promo codes, auto-charge, payouts, multi-location. See `docs/02-mvp-scope.md`.
