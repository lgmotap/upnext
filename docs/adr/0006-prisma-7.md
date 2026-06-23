# ADR 0006: Standardize on Prisma 7

**Status:** Accepted  
**Date:** 2025-06-23

## Context

UpNext uses Supabase Postgres + Next.js App Router. Prisma 6 was initially scaffolded. Prisma 7 introduces `prisma.config.ts`, driver adapters (`@prisma/adapter-pg`), and generated client outside `node_modules`.

## Decision

Upgrade to **Prisma 7** and document the decision in agent instruction files so all AI tooling stays aligned.

- `prisma-client` generator → `generated/prisma/`
- `prisma.config.ts` with `DIRECT_URL` for migrations
- `lib/db/prisma.ts` with `PrismaPg` + `DATABASE_URL` for runtime
- Keep existing folder layout (`app/`, `lib/`, `server/` — no `src/` migration)
- Keep **Organization/Membership** tenant model (do not rename to Workspace)

## Consequences

- Requires Node ≥ 20.19, TypeScript ≥ 5.4, `"type": "module"` in `package.json`
- `postinstall` must run `prisma generate` explicitly
- Prisma VS Code extension should validate as Prisma 7 (or pin consistently)
- Slightly more setup than Prisma 6; better long-term alignment with Prisma + serverless Postgres

## Rejected alternatives

- Stay on Prisma 6 — rejected (editor/tooling drift, EOL path)
- Drizzle — rejected (ORM churn, team already on Prisma)
- `src/` restructure — rejected (unnecessary churn for MVP)
