# BookedFox SEO & GEO Playbook

**Domain:** `https://bookedfox.com`  
**Sprints:** `tasks/seogeo/`  
**Agent rule:** `.cursor/rules/130-seo-geo-marketing.mdc`  
**Config:** `lib/config.ts` (`site`, `phase`, `faqs`, `marketingRoutes`)

---

## What gets indexed

Only the **marketing site** on `bookedfox.com`:

| URL | Index |
|-----|-------|
| `/` | Yes |
| `/privacy` | Yes |
| `/terms` | Yes |
| Everything else on this host | **No** |

The product (`/app/*`), crew app, auth, APIs, tenant booking (`/book/*`), and customer portals (`/my/*`) are **application routes** — not marketing. They must carry `robots: noindex, nofollow` and appear in `robots.txt` `Disallow` rules.

---

## Phase model

```ts
// lib/config.ts
export type LaunchPhase = "waitlist" | "launch";
export const phase: LaunchPhase = "waitlist";
```

### Waitlist phase (current)

- Landing promotes early access; primary CTA → `#waitlist`.
- Meta description includes **waitlist CTA** (≤155 chars).
- Schema `offers.availability` → `https://schema.org/PreOrder`.
- Waitlist form POSTs to `/api/waitlist`.

### Launch phase (full landing, no waitlist)

Flip **one constant**: `phase = "launch"`. Then verify:

| Surface | Change |
|---------|--------|
| `seoMeta` | Remove waitlist CTA; add “Start free” messaging |
| `cta` | Primary → `/sign-up` |
| Hero / FinalCTA | Signup instead of waitlist |
| `faqs` | Update availability + pricing questions |
| JSON-LD `offers` | `availability` → `https://schema.org/InStock` |
| On-page waitlist section | Remove or replace with signup block |
| **Sitemap** | Unchanged — still 3 marketing URLs only |
| **`/app/*` index** | Still **noindex** |

**Do not** add `/sign-up` to the sitemap.

---

## File ownership

| Concern | Files |
|---------|-------|
| Global marketing meta | `app/layout.tsx`, `lib/config.ts` |
| Home page meta override | `app/page.tsx` |
| JSON-LD | `components/seo/JsonLd.tsx`, `lib/seo/schema.ts` (recommended) |
| robots.txt | `app/robots.ts` |
| sitemap.xml | `app/sitemap.ts` |
| OG image | `app/opengraph-image.png` |
| Icons | `app/favicon.ico`, `app/icon.png`, `app/apple-icon.png` |
| GTM (marketing only) | `@next/third-parties/google`, `lib/analytics/gtm.ts`, `lib/seo/marketing-paths.ts` |
| App noindex | `app/app/layout.tsx`, `app/(auth)/layout.tsx`, `app/crew/layout.tsx`, `app/book/layout.tsx` |
| FAQ copy | `lib/config.ts` → `faqs` |
| LLM crawler file | `public/llms.txt` |

---

## Title & description rules

| Field | Rule |
|-------|------|
| `<title>` | Brand **first** (`BookedFox \| …`), ≤60 characters |
| `<meta name="description">` | ≤155 characters, vertical keywords + phase CTA |
| `site.description` | Long GEO paragraph — JSON-LD + footer only, **not** meta description |
| `og:description` | Same as meta description on `/` |
| `og:image` | Absolute URL, 1200×630, required |

---

## JSON-LD graph (required nodes)

1. **Organization** — name, url, logo (`ImageObject`), email, `sameAs` (when profiles exist)
2. **WebSite** — publisher → Organization
3. **SoftwareApplication** — `applicationCategory: BusinessApplication`, audience trades, phase-aware `offers`
4. **FAQPage** — mirrors `faqs` in config

Place script in **`<head>`**. Use `@graph` + `@id` cross-references.

---

## GEO content patterns

### Feature lists (`Solution.tsx`)

```html
<ul>
  <li><strong>Online booking requests:</strong> Let customers request services…</li>
</ul>
```

### FAQ

- All answers must exist in **SSR HTML** (use `<details>` or server component).
- Do not gate answers behind client-only `useState`.

### Semantic landmarks

`<header>`, `<main>`, `<footer>`, `<section>`, `<article>`, `<nav aria-label>`.

---

## robots.txt template

```
User-agent: *
Allow: /
Disallow: /app/
Disallow: /crew/
Disallow: /api/
Disallow: /sign-in
Disallow: /sign-up
Disallow: /forgot-password
Disallow: /auth/
Disallow: /book/
Disallow: /my/

Host: https://bookedfox.com
Sitemap: https://bookedfox.com/sitemap.xml
```

---

## Google Tag Manager (marketing only)

Load GTM **only** on indexable marketing routes (`/`, `/privacy`, `/terms`). Never on `/app/*`, `/book/*`, auth, crew, or portals — those are product surfaces with tenant/customer data.

| Step | Action |
|------|--------|
| Env | `NEXT_PUBLIC_GTM_ID=GTM-…` in Vercel + `.env.local` |
| New marketing page | Add to `marketingRoutes` in `lib/config.ts` (auto-syncs sitemap + GTM via `lib/seo/marketing-paths.ts`) |
| Page metadata | Export `robots: { index: true, follow: true }` + canonical |
| Verify | `NEXT_PUBLIC_GTM_ID=GTM-… npm run smoke:seo` — GTM on `/`, absent on `/sign-in` |

Implementation: `proxy.ts` sets `x-marketing-page: 1`; root `app/layout.tsx` injects head + body GTM snippets when that header is present.

**Do not** add GTM to non-marketing layouts or load it globally without the marketing-path gate.

---

## Validation

```bash
npm run smoke:seo
npm run build
```

Production:

```bash
curl -sI https://bookedfox.com/
curl -s https://bookedfox.com/robots.txt
curl -s https://bookedfox.com/sitemap.xml
```

---

## Launch checklist cross-ref

See `tasks/launch-checklist.md` § Marketing SEO / GEO.

---

## Changelog

When changing product behavior or marketing phase, update `CHANGELOG.md` and run the SEO-05 checklist if `phase` flips.
