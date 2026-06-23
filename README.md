# UpNext — Waitlist Landing Page

Premium pre-launch landing page for a service-business platform (cleaning, lawn care, handyman, painting, pet walking, pressure washing, roofing, car wash, and more).

Stack: **Next.js (App Router) · TypeScript · Tailwind CSS v4 · Prisma 7 · Supabase · Lucide · Framer Motion**

**Node.js ≥ 20.19** required (Prisma 7). Use `nvm use` with `.nvmrc` (Node 22).

## Run it

```bash
nvm use                    # Node 22 (see .nvmrc)
npm install
cp .env.example .env.local   # fill Supabase + database URLs (see comments in file)
npm run db:generate
npm run dev                  # http://localhost:3000
npm run build                # production build
```

Agent/stack docs: `AGENTS.md`, `docs/architecture/database.md`.

Product auth and `/app/*` routes require `.env.local`. On Vercel, set the same variables in Project Settings → Environment Variables (never commit `.env.local`).

## Where things live

| What | Where |
|---|---|
| All CTA text, nav, form options, brand name | [lib/config.ts](lib/config.ts) |
| Page sections (one component each) | [components/sections/](components/sections/) |
| Dashboard / mobile / before-after mockups | [components/mockups/](components/mockups/) |
| Soft-3D SVG objects | [components/three-d/Objects.tsx](components/three-d/Objects.tsx) |
| Design tokens (brand teal, ink neutrals, shadows) | [app/globals.css](app/globals.css) |
| Waitlist API | [app/api/waitlist/route.ts](app/api/waitlist/route.ts) |

## Waitlist leads

Submissions are appended to `data/waitlist.jsonl` (one JSON object per line: id, firstName, email, businessName, businessType, businessSize, currentTool, source, createdAt). The file is gitignored.

To switch storage to Supabase / Airtable / anything else, replace only the `persist()` function in [app/api/waitlist/route.ts](app/api/waitlist/route.ts).

> Note: file storage works on a regular server but not on serverless hosts (Vercel) — swap `persist()` before deploying there.

## Going from waitlist → launch

Every button on the page reads from `cta` in [lib/config.ts](lib/config.ts). To switch from "Join the waitlist" to "Start free":

1. Change `cta.primary` / `cta.compact` labels and point `href` at `/signup`.
2. Set `phase` to `"launch"`.
3. Optionally remove `<AnnouncementBar />` and `<Waitlist />` from [app/page.tsx](app/page.tsx).

No section needs a redesign.
