# Sprint SEO-03 — JSON-LD entity architecture

> **Goal:** Valid Schema.org `@graph` in the document **`<head>`** with Organization, WebSite, SoftwareApplication, and FAQPage — optimized for Google rich results and LLM entity extraction.

**Depends on:** SEO-02 (`seoMeta`, `site.url`).  
**Source:** `components/seo/JsonLd.tsx`, `lib/seo/schema.ts`, `lib/config.ts`.

---

## 1. Placement — `<head>` not `<body>`

- [x] JSON-LD injected via `<head><JsonLd /></head>` in `app/layout.tsx`.
- [x] Exactly **one** `application/ld+json` block per page (marketing layout).
- [x] Script appears before `<body>` content in rendered HTML.

---

## 2. Organization node

- [x] `socialProfiles` array in `lib/config.ts` (empty until live — `sameAs` omitted when empty).
- [x] Logo as `ImageObject` with width/height 512.
- [x] `@id` stable: `https://bookedfox.com/#organization`.

---

## 3. WebSite node

- [x] WebSite node with `publisher` → Organization `@id`.
- [x] No `SearchAction` (no site search yet).

---

## 4. SoftwareApplication node (primary entity)

- [x] `applicationCategory: BusinessApplication`
- [x] `operatingSystem: Web` only
- [x] Full `site.description` on SoftwareApplication
- [x] Audience includes cleaning, lawn care, handyman, plumbing, HVAC, painting, pressure washing, pet care, car wash, roofing, contractors, teams 2–50
- [x] `getSchemaOffers(phase)` in `lib/seo/schema.ts` — PreOrder on waitlist, InStock on launch

---

## 5. FAQPage node

- [x] `mainEntity` mirrors `faqs` from `lib/config.ts`.
- [x] `@id`: `https://bookedfox.com/#faq`.

---

## 6. Graph structure

- [x] `@graph` with cross-`@id` references.
- [x] JSON-LD primary; no duplicate FAQPage microdata in HTML.

---

## 7. Validation

- [ ] [Google Rich Results Test](https://search.google.com/test/rich-results) on production URL (after deploy).
- [ ] [Schema Markup Validator](https://validator.schema.org/) — paste JSON-LD (manual).
- [x] `npm run smoke:seo` — parses JSON-LD, asserts `@type` nodes and `PreOrder` when `phase === "waitlist"`.

---

## Acceptance criteria

- [x] JSON-LD in `<head>` with 4-node `@graph`.
- [x] `SoftwareApplication.applicationCategory` = `BusinessApplication`.
- [x] `offers.availability` = `https://schema.org/PreOrder` on waitlist.
- [x] Organization includes structured logo; `sameAs` when profiles exist.
