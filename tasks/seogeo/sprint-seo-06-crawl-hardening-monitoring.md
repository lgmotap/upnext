# Sprint SEO-06 — Crawl hardening, smoke tests & monitoring

> **Goal:** Automated regression checks so SEO/GEO never breaks across deploys; AI-crawler documentation; ongoing monitoring hooks.

**Depends on:** SEO-01–04 implemented.  
**Runs:** After every marketing change + in CI optional.

---

## 1. `scripts/smoke-seo.ts` + `npm run smoke:seo`

### Homepage checks

- [x] HTTP 200 on `/`.
- [x] `<title>` length ≤ 60; contains `BookedFox` in first 15 chars.
- [x] `<meta name="description">` length ≤ 155.
- [x] `<meta name="robots">` contains `index` (not `noindex`) on `/`.
- [x] `<link rel="canonical" href="https://bookedfox.com"/>` (or metadataBase equivalent).
- [x] `og:image` present with opengraph-image reference.
- [x] JSON-LD parses; `@graph` includes `Organization`, `SoftwareApplication`, `FAQPage`.
- [x] When `phase === "waitlist"`: `PreOrder` in offers.
- [x] FAQ answer count in HTML ≥ 9.

### Non-indexable routes

- [x] `/sign-in` — response contains `noindex`.
- [x] `/robots.txt` contains `Disallow: /app/` and `Sitemap: https://bookedfox.com/sitemap.xml`.
- [x] `/sitemap.xml` — 3 URLs only; all on `bookedfox.com`; no `/app/`.

### package.json

- [x] `"smoke:seo": "tsx scripts/smoke-seo.ts"`.
- [x] Documented in `docs/marketing/seo-geo-playbook.md` and `.cursor/rules/130-seo-geo-marketing.mdc`.

---

## 2. `public/llms.txt` (GEO emerging standard)

- [x] Static `public/llms.txt` at `/llms.txt`.
- [x] Lists blocked crawl paths; no tenant booking URLs.
- [x] `smoke:seo` verifies `/llms.txt` returns 200.

---

## 3. Layout noindex audit

- [x] `smoke:seo` reads `app/app`, `(auth)`, `crew`, `book`, `my` layouts — asserts `index: false`.
- [x] No exceptions for marketing layouts.

---

## 4. Google Search Console setup (owner)

- [ ] Property: `https://bookedfox.com` (domain or URL prefix).
- [ ] Submit sitemap: `https://bookedfox.com/sitemap.xml`.
- [ ] Monitor: Coverage, FAQ rich results, Core Web Vitals.
- [ ] Document login in `HANDOFF.md` (no secrets in repo).

---

## 5. Production monitoring (quarterly)

- [ ] Re-run technical audit checklist from `tasks/seogeo/README.md`.
- [ ] Verify OG preview after any metadata change.
- [ ] Confirm `bookedfox.com` SSL valid; no accidental `staging.*` indexable.

---

## 6. CI integration (optional)

- [ ] Add `npm run smoke:seo` to PR checklist when marketing SEO files change.
- [ ] Fail PR if title/description exceed limits (covered by `smoke:seo` today).

---

## Acceptance criteria

- [x] `npm run smoke:seo` passes locally.
- [ ] `SMOKE_BASE_URL=https://bookedfox.com npm run smoke:seo` passes on production (after deploy).
- [x] `llms.txt` served at `/llms.txt` locally.
- [ ] Launch checklist SEO section fully checked after GSC + production smoke.
