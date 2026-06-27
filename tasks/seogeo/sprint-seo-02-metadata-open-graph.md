# Sprint SEO-02 — Metadata, Open Graph & social cards

> **Goal:** Brand-first titles, SERP-safe descriptions, complete OG/Twitter tags for `bookedfox.com` waitlist phase. All strings phase-aware via `lib/config.ts`.

**Depends on:** SEO-01 (production serving `/`).  
**Blocks:** SEO-05 (launch copy swap builds on this structure).

---

## 1. Centralize SEO strings in `lib/config.ts`

- [x] Implement `seoMeta` + helper `getSeoMeta()` in `lib/seo/get-seo-meta.ts`.
- [x] Remove duplicate `seo.pages` object — use `marketingRoutes` + `seoKeywords` only.
- [x] Character limits enforced via `npm run smoke:seo`.

---

## 2. `<title>` tag rules

- [x] Update `app/layout.tsx` `title.default` to use `seoMeta`.
- [x] Update `app/page.tsx` metadata to use `getSeoMeta().title`.
- [x] Keep `title.template: '%s | BookedFox'` for `/privacy`, `/terms`.

---

## 3. `<meta name="description">`

- [x] Home `/` uses `seoMeta[phase].description` (not full `site.description`).
- [x] Waitlist description includes waitlist CTA (“Join the free waitlist…”).
- [x] `site.description` reserved for JSON-LD, footer, and GEO body copy.
- [x] `site.shortDescription` retained for manifest + schema (not triple-used in meta).

---

## 4. Open Graph (complete set)

- [x] `og:title` — from `seoMeta[phase].ogTitle`
- [x] `og:description` — same as meta description (≤155)
- [x] `og:url` — `https://bookedfox.com`
- [x] `og:type` — `website`
- [x] `og:site_name` — `BookedFox`
- [x] `og:locale` — `en_US`
- [x] `og:image` — `/opengraph-image.png` (absolute via `metadataBase`)
- [x] `og:image:width` / `og:image:height` — 1200 × 630
- [x] `og:image:alt` — descriptive alt string
- [x] Twitter `summary_large_image` + matching title, description, image.
- [x] `metadataBase: new URL(site.url)` in root layout.

---

## 5. Canonical & alternates

- [x] `<link rel="canonical" href="https://bookedfox.com"/>` on `/`.
- [x] `/privacy` → canonical `/privacy`; `/terms` → canonical `/terms`.
- [x] No canonical pointing to hash fragments (`#waitlist`).
- [ ] Optional: Vercel redirect stripping `utm_*` to bare `/` (document only — not needed until campaigns run).

---

## 6. Icons & manifest

- [x] `app/favicon.ico`, `app/icon.png`, `app/apple-icon.png`, `app/opengraph-image.png`.
- [x] `app/manifest.ts` — theme colors match brand.
- [x] Regenerate icons after brand change: `npm run generate:icons`.

---

## 7. Validation

- [x] `npm run smoke:seo` asserts title length ≤ 60, description ≤ 155, `og:image` present.
- [ ] Manual: [opengraph.xyz](https://www.opengraph.xyz/) on production URL (after deploy).
- [ ] Google Rich Results Test on live URL (optional, after deploy).

---

## Acceptance criteria

- [x] Local view-source on `/`: one `<title>`, brand-first, ≤ 60 chars.
- [x] Local: meta description ≤ 155 chars with waitlist CTA.
- [x] Local: all core OG tags + image present.
- [ ] Production: OG preview verified after deploy.
