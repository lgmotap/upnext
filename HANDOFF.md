# UpNext — Handoff / Continue-from-Cursor

Snapshot of where the project stands and exactly how to keep going. Pairs with
`.claude/CLAUDE.md`, `.cursor/rules/*`, `docs/`, and `tasks/`.

## TL;DR
- **Marketing landing page** (`/`) — done (Pluto-style green). Untouched by product work.
- **Product app** (`/app/*`) — Pluto-styled UI shell on **mock data** (`lib/mock/`), navigable.
- **Auth** (Supabase) + **Prisma 7** backend — wired; DB schema migrated (User, Organization,
  Membership, BusinessProfile).
- **Onboarding wizard** (`/app/onboarding`) — built and building green; runs once real DB env is set.
- Stack is green on **Node 22 / Prisma 7**: `db:validate`, `db:generate`, `typecheck`, `lint`, `build`.

## ⚠️ The one thing blocking live runtime: 3 secrets
`.env.local` has real **public** Supabase values; these 3 **secrets** are placeholders:

| Var | Source (Supabase dashboard, project `upnext-saas-supa`) |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → `service_role` key |
| `DATABASE_URL` | Connect → ORMs/Prisma → **pooled** URL (port 6543) |
| `DIRECT_URL` | Connect → ORMs/Prisma → **direct** URL (port 5432) |

Best practice (already half-set-up): keep secrets in **Vercel** and pull locally.
```bash
# Add the 3 secrets in Vercel → upnext-saas → Settings → Environment Variables (all envs), then:
vercel env pull .env.local        # project is already linked (.vercel/)
# verify:
node -e "require('dotenv').config({path:'.env.local'}); console.log(require('tsx/cjs') && 0)" 2>/dev/null
```
Public `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are already set in Vercel
(Production/Preview/Development) and in `.env.local`.

## Run locally
```bash
nvm use                 # Node 22 (.nvmrc)
npm install             # if engine EPERM, see note below
npm run dev             # http://localhost:3000
```
- `/` landing · `/app/dashboard` product shell (mock) · `/sign-in` · `/app/onboarding`.
- Until the 3 secrets are real, `/app/*` redirects to `/sign-in` and auth shows
  "Server is not configured".

### macOS Prisma engine `EPERM` workaround
`prisma generate` may fail copying `node_modules/@prisma/engines/schema-engine-darwin-arm64`
(security policy blocks `copyfile` preserving `com.apple.provenance`). Fix:
```bash
part=$(find "$TMPDIR" -name partial 2>/dev/null | head -1)   # the downloaded binary
cp "$part" node_modules/@prisma/engines/schema-engine-darwin-arm64 && chmod +x "$_"
npm run db:generate
```
Not an issue on Linux CI / Vercel.

## Test the onboarding flow (once env is real)
1. `npm run dev` → `/sign-up` → create an account.
2. Sign-up provisions org + owner membership + BusinessProfile, then redirects to `/app/onboarding`.
3. Fill business details → Continue → "Finish & go to dashboard".
4. Verify with the Supabase connector / SQL: `Organization.timezone/currency` and
   `BusinessProfile.serviceArea/phone/description` updated for your org.

## Security: enable RLS (decision pending)
Supabase reports **Row Level Security disabled** on all 4 tables. The app reads via Prisma
(direct connection, bypasses RLS), so enabling it is safe:
```sql
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Membership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BusinessProfile" ENABLE ROW LEVEL SECURITY;
```

## Architecture quick map (follow these patterns)
- `server/validators/*` — Zod input schemas
- `server/permissions/{session,can}.ts` — auth session + RBAC (deny by default)
- `server/services/*` — business logic + Prisma writes (repositories come in Sprint 02+)
- `server/actions/*` — `"use server"` actions: session → permission → validate → service
- `app/app/*` — product UI (currently mock data except onboarding)
- `lib/mock/data.ts` — mock data to be replaced by real queries

## Next steps (Sprint 02)
1. Add `Service`, `AvailabilityRule`, `BlackoutDate` models (`docs/07`) + migration.
2. Services CRUD + availability settings (replace mock `/app/services`, settings).
3. Wire `/app/dashboard`, `/app/bookings`, etc. to real data via `server/services` +
   `server/repositories` (introduce the repo layer here — multiple queries per entity now).
4. Public booking `/book/[slug]` → real availability + create BookingRequest.

See `tasks/sprint-02-services-availability.md` and onward.
