# Auth and Permissions Architecture

**This project uses Prisma 7 + Supabase Auth + Next.js.**

Prisma owns application data; Supabase Auth owns identity. Do not store passwords in Prisma tables. Do not use Prisma as the auth system.

## Authentication — Supabase

| Concern | Implementation |
|---------|----------------|
| Sign-in / sign-up / reset | Supabase Auth via `@supabase/ssr` |
| Browser client | `lib/supabase/client.ts` — client components only |
| Server client | `lib/supabase/server.ts` — Server Components, Actions, Route Handlers |
| Session refresh | `lib/supabase/proxy.ts` + root `proxy.ts` |
| Admin operations | `lib/supabase/admin.ts` — service role, server-only |

Supported flows: email/password, magic links, OAuth, password recovery (`app/auth/callback/route.ts`).

## Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...    # browser-safe (publishable)
SUPABASE_SERVICE_ROLE_KEY=...        # server-only — never in client
DATABASE_URL=...                     # server-only — Prisma runtime
DIRECT_URL=...                       # server-only — Prisma migrations
```

Never expose `DATABASE_URL`, `DIRECT_URL`, or `SUPABASE_SERVICE_ROLE_KEY` to the browser.

## Identity mapping

- Supabase `auth.users.id` = Prisma `User.id`
- On sign-up, `server/services/onboarding.ts` provisions User + Organization + Membership + BusinessProfile.

## Tenant model

| Concept | UpNext model |
|---------|--------------|
| Workspace / tenant | `Organization` |
| Membership | `Membership` (role + status) |
| Public booking identity | `BusinessProfile.publicSlug` |

## Roles

```txt
owner      — billing, delete org, full access
admin      — full ops except ownership transfer/delete
dispatcher — bookings, jobs, customers, schedule
worker     — assigned jobs only
viewer     — read-only
```

Permission matrix: `docs/10-auth-and-permissions.md`.

## Required server checks

Every server function touching org-owned data must verify:

1. Authenticated Supabase user exists.
2. User has active `Membership` for the organization.
3. Role permits the action.
4. Entity belongs to that organization.

Helpers: `server/permissions/session.ts` (`getAppSession`, `requireAppSession`).

## Public endpoints

`/book/[businessSlug]` exposes only public business/service data. Rate-limit customer-facing endpoints.

## RLS

- Enable RLS on Supabase tables accessed from the browser.
- Prisma server queries must still enforce permissions in code (RLS does not apply to direct Postgres connections used by Prisma).

## Mutation checklist

1. Get current Supabase user / app session.
2. Validate input with Zod (`server/validators/`).
3. Check organization membership and role.
4. Execute Prisma mutation (via `lib/db/prisma.ts`).
5. Return typed response.
6. Log important actions to `ActivityLog` when implemented.

## Related docs

- `docs/10-auth-and-permissions.md`
- `docs/architecture/database.md`
- `.cursor/rules/060-auth-rbac-security.mdc`
