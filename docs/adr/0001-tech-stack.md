# ADR 0001: Tech Stack
**Status:** Accepted
**Decision:** Next.js App Router + TypeScript + Tailwind (+ shadcn/ui later), Postgres + **Prisma 7**, Supabase Auth/Storage, Stripe, Resend, PostHog, Sentry, Vercel. See ADR 0006 for Prisma 7 details.
**Why:** Boring, modern, well-supported by Cursor/Claude; fast for a solo founder; clear upgrade path.
**Consequences:** Some vendor lock-in (Supabase/Stripe/Vercel) accepted for speed.
