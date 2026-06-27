# Sprint SEO-04 — GEO content structure & HTML parity

> **Goal:** On-page HTML is machine-readable for LLM crawlers — semantic landmarks, SSR FAQ answers, Bold-Colon feature lists, and JSON-LD parity.

**Depends on:** SEO-03 (FAQ content in `lib/config.ts`).  
**Does not change:** Product app UI under `/app/*`.

---

## 1. Semantic HTML landmarks (audit compliance)

| Element | Location | Status |
|---------|----------|--------|
| `<header>` | `Header.tsx` | ✅ |
| `<main id="main">` | `app/page.tsx` | ✅ |
| `<footer>` | `Footer.tsx` | ✅ |
| `<article>` | `Section.tsx` (marketing blocks) | ✅ |
| `<aside>` | `AnnouncementBar.tsx` | ✅ |
| `<nav aria-label>` | Header, Footer columns | ✅ |

- [x] `Section` renders `<article>` with optional `labelledBy` + `SectionHeading` `headingId`.
- [x] `AnnouncementBar` → `<aside aria-label="Announcement">`.
- [x] Single `<h1>` on page (Hero only).
- [x] Heading hierarchy: `h1` → `h2` (section) → content (no skipped levels in feature lists).

---

## 2. Feature lists — Bold-Colon convention (GEO)

- [x] `Solution.tsx` — `<ul>/<li>` with `<strong>{title}:</strong> {text}`.
- [x] `Benefits.tsx` — same Bold-Colon `<ul>/<li>` pattern.
- [x] Visual card styling preserved.

---

## 3. FAQ — SSR all answers (critical)

- [x] `FAQ.tsx` is a **server component** (removed `"use client"`).
- [x] Native `<details>` / `<summary>` — all 9 answers in initial HTML.
- [x] No HTML microdata (JSON-LD is primary — avoids duplicate FAQPage in GSC).

---

## 4. Entity consistency fixes

- [x] `Footer.tsx` — `mailto:${site.contactEmail}`.
- [x] `Header.tsx` / `Footer.tsx` — brand link `href="/"`.
- [x] Industry strip / WhoItsFor trades align with JSON-LD `audienceType`.

---

## 5. Waitlist form accessibility (keep)

- [x] `<label htmlFor="wl-email">` bound to `id="wl-email"`.
- [x] All fields keep explicit labels + `autocomplete`.
- [x] Form submission stays client `fetch` — not render-blocking.

---

## 6. Performance notes (GEO crawl budget)

- [x] Lazy-load decorative 3D objects in `Waitlist` via `dynamic(..., { ssr: false })`.
- [x] `WhoItsFor` images: `width={640}` `height={288}` + `loading="lazy"`.
- [x] Skip-nav link in `Header.tsx` → `#main`.

---

## 7. Validation

- [x] `npm run smoke:seo` — FAQ `<details>` count ≥ 9.
- [x] `npm run smoke:seo` — Bold-Colon feature pattern present.
- [ ] `curl -s https://bookedfox.com/` production verification (after deploy).
- [ ] Lighthouse Accessibility ≥ 90 on `/` (run after deploy).

---

## Acceptance criteria

- [x] All FAQ answers in initial HTML without JS.
- [x] Solution + Benefits in `<ul>/<li>` with Bold-Colon format.
- [x] Footer email and home links correct.
- [x] No client-only gating of marketing copy intended for crawlers.
