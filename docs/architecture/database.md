# Database Architecture

**This project uses Prisma 7, not Prisma 6.**

Do not downgrade Prisma. Do not replace Prisma with Drizzle unless explicitly requested by the project owner. All database access must follow the rules in this document.

## Stack

| Layer | Technology |
|-------|------------|
| Database | Supabase Postgres |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Migrations | Prisma Migrate (`prisma/migrations/`) |
| Runtime connection | `DATABASE_URL` (transaction pooler, port 6543) |
| Migration connection | `DIRECT_URL` (session/direct, port 5432) |

## Prisma 7 configuration

### Schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}
```

- Do **not** use `provider = "prisma-client-js"`.
- Do **not** put `url` or `directUrl` in the datasource block (Prisma 7 uses `prisma.config.ts`).

### Config (`prisma.config.ts`)

- `datasource.url` → `DIRECT_URL` for CLI migrations.
- Load env with `import "dotenv/config"` (Prisma 7 does not auto-load `.env`).

### Client (`lib/db/prisma.ts`)

- Import from `@/generated/prisma/client`.
- Use `PrismaPg` adapter with `DATABASE_URL` at runtime.
- Singleton pattern with `globalThis` in development.
- **Never** import Prisma in client components.

## Where Prisma is allowed

```txt
Server Components
Server Actions
Route Handlers
server/repositories/*
server/services/*
server/permissions/*
Cron / background jobs
```

## Where Prisma is forbidden

```txt
Client components ("use client")
Browser code
Shared UI components
Marketing pages that only need public data
```

## Tenant isolation

Every business-owned entity has `organizationId` (directly or via relation). Every query must filter by the authenticated user's active organization membership.

```ts
// Required pattern
const session = await requireAppSession();
const rows = await prisma.bookingRequest.findMany({
  where: { organizationId: session.organizationId },
});
```

Never run unscoped queries like `prisma.bookingRequest.findMany()` for tenant data.

## Model conventions

```prisma
id        String   @id @default(cuid())
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
```

Workspace-owned tables (UpNext: **organization-owned**):

```prisma
organizationId String
organization   Organization @relation(...)

@@index([organizationId])
```

Index: `organizationId`, `userId`, `email`, `status`, `createdAt`, foreign keys, `slug`, Stripe IDs.

Money: integer **cents**. Timestamps: **UTC**. Display in org timezone.

## Migrations

```bash
npm run db:generate
npm run db:validate
npm run db:migrate    # dev: prisma migrate dev
npm run db:deploy     # prod: prisma migrate deploy
```

Rules:

- Never edit production DB manually without a migration.
- Never use `prisma db push` for production.
- Never delete applied migration files.
- Ask before destructive migrations (drop/rename columns, data loss).

Prisma 7: `migrate dev` no longer auto-runs `generate` or seed — run `db:generate` explicitly.

## RLS vs Prisma

- **Supabase browser client** queries rely on RLS policies.
- **Prisma backend** queries are **not** protected by RLS — enforce authz in server code.
- **Service role** bypasses RLS — server-only, trusted operations (signup provisioning, webhooks).

## Related docs

- `docs/07-data-model.md` — entity list
- `docs/06-architecture.md` — folder layout
- `docs/adr/0006-prisma-7.md` — upgrade decision
