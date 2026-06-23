# Sprint 00 — Setup
- [x] Repository structure (docs, .cursor, .claude, tasks, app/*, server, lib, prisma, emails, tests, scripts)
- [x] Product docs + ADRs
- [x] Pluto-styled product UI shell on mock data (no backend)
- [x] Install backend deps (Prisma 7, Supabase, Zod, Resend)
- [x] Prisma 7 agent rules + `docs/architecture/*` + ADR 0006
- [x] Node 22 (`.nvmrc`), `nvm alias default 22`, `npm install`, Prisma 7 client generated
- [x] Green validate loop: db:validate, db:generate, typecheck, lint, build
- [x] Env wiring from .env.example
- [ ] CI: typecheck + lint + test on PR
- [ ] Real env (.env / Supabase + DATABASE_URL) before migrations & live auth

## Notes
- `prisma generate` fails locally with `EPERM` copying the schema-engine binary into
  `node_modules/@prisma/engines` — macOS security policy blocks `copyfile` preserving the
  `com.apple.provenance` xattr. Workaround used: plain `cp` of the downloaded binary (drops the
  xattr). Alternatively allow it in the device's security software. Not an issue on Linux CI / Vercel.
- A local `.env` with PLACEHOLDER db URLs exists (gitignored) so generate/validate/build run
  without a database. Replace with real Supabase creds before `db:migrate` / live sign-up.
