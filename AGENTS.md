# UpNext — Agent Instructions

**This project uses Prisma 7, not Prisma 6.**

Do not downgrade Prisma. Do not replace Prisma with Drizzle unless explicitly requested by the project owner. All database access must follow `docs/architecture/database.md`.

## Read first

| Priority | File |
|----------|------|
| 1 | `.cursor/rules/000-stack-prisma7-supabase.mdc` |
| 2 | `docs/architecture/ai-agent-rules.md` |
| 3 | `docs/architecture/database.md` |
| 4 | `docs/architecture/auth-and-permissions.md` |
| 5 | `docs/02-mvp-scope.md`, `docs/06-architecture.md`, `docs/07-data-model.md` |

## Stack

```txt
Next.js App Router (routes in app/ — no src/ directory)
Supabase Auth + Postgres + Storage
Prisma 7 + @prisma/adapter-pg + pg
TypeScript, Tailwind, shadcn/ui (later)
```

## Forbidden

```txt
Prisma 6 / prisma-client-js
Drizzle, TypeORM, Sequelize, MongoDB
Prisma in client components
Service role key or DATABASE_URL in browser code
Unscoped tenant queries
```

## Key paths

```txt
lib/db/prisma.ts                 — Prisma singleton (server-only)
@/generated/prisma/client        — generated Prisma client
lib/supabase/client.ts           — browser Supabase
lib/supabase/server.ts           — server Supabase
lib/supabase/proxy.ts            — session refresh
proxy.ts                         — Next.js proxy matcher
server/actions/                  — server actions
server/permissions/              — RBAC
prisma/schema.prisma
prisma.config.ts
```

## Tenant model

**Organization** + **Membership** = tenant. Use `organizationId` on all business-owned tables. Roles: owner, admin, dispatcher, worker, viewer.

## Validation before finishing

```bash
npm run db:validate
npm run db:generate
npm run typecheck
npm run lint
npm run build
```

Or: `scripts/ai/validate.sh`

---

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
