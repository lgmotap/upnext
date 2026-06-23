# ADR 0003: Auth Provider
**Status:** Accepted
**Decision:** Supabase Auth for MVP (email/password + magic link), organization membership modeled in our own DB.
**Why:** Integrates with Supabase Postgres/Storage; simple; can swap to Clerk later behind a thin `lib/auth` boundary.
