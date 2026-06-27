# Sprint SEO-01 — Indexation baseline & crawl gates

> **Goal:** Only `bookedfox.com` marketing URLs are indexable. Product, auth, booking, and portal routes are blocked at **robots.txt**, **meta robots**, and **middleware** layers.

**Depends on:** Existing `app/page.tsx` landing route deployed to production.  
**Blocks:** SEO-02, SEO-03, SEO-04.

---

## 1. Production deploy verification (P0)

- [ ] Confirm `https://bookedfox.com/` returns **200** with waitlist landing HTML (not Next.js 404 shell).
- [ ] Confirm response does **not** include `<meta name="robots" content="noindex"/>`.
- [ ] Purge Vercel edge cache if a stale 404 was cached.
- [ ] Document deploy date in `HANDOFF.md`.

**Verify:**

```bash
curl -sI https://bookedfox.com/ | head -5
curl -s https://bookedfox.com/ | rg -o '<title>[^<]+</title>|<meta name="robots"[^>]*>'
```

> **BLOCKER (owner):** Code complete locally; production still on stale build as of 2026-06-26. Push + deploy `main`, then re-run checks above and `SMOKE_BASE_URL=https://bookedfox.com npm run smoke:seo`.

---

## 2. `robots.txt` (`app/robots.ts`)

- [x] `User-agent: *` with `Allow: /`.
- [x] `Disallow` all non-marketing prefixes:

```
/app/
/crew/
/api/
/sign-in
/sign-up
/forgot-password
/auth/
/book/
/my/
```

- [x] `/book/*/embed` covered by `Disallow: /book/` (embed widgets blocked).
- [x] `Sitemap: https://bookedfox.com/sitemap.xml` (absolute URL).
- [x] `Host: https://bookedfox.com`.
- [ ] Post-deploy: `curl -s https://bookedfox.com/robots.txt` returns **text/plain**, not HTML 404.

---

## 3. `sitemap.xml` (`app/sitemap.ts`)

- [x] Only `marketingRoutes` from `lib/config.ts`:
  - `https://bookedfox.com` — `priority: 1`, `changefreq: weekly`
  - `https://bookedfox.com/privacy` — `priority: 0.3`, `changefreq: yearly`
  - `https://bookedfox.com/terms` — `priority: 0.3`, `changefreq: yearly`
- [x] Valid XML namespace: `http://www.sitemaps.org/schemas/sitemap/0.9`.
- [x] **Never** add `/app/*`, `/book/*`, `/sign-up`, or hash URLs (`#waitlist`).
- [ ] Post-deploy: `curl -s https://bookedfox.com/sitemap.xml` validates in browser or `xmllint`.

---

## 4. Meta `robots: noindex` on non-marketing layouts

| Layout | Path | `robots` |
|--------|------|----------|
| `app/app/layout.tsx` | `/app/*` | `index: false, follow: false` ✅ |
| `app/(auth)/layout.tsx` | `/sign-in`, `/sign-up`, … | `index: false, follow: false` ✅ |
| `app/crew/layout.tsx` | `/crew/*` | `index: false, follow: false` ✅ |
| `app/book/layout.tsx` | `/book/[businessSlug]/*` | `index: false, follow: false` ✅ |
| `app/my/layout.tsx` | `/my/[businessSlug]/*` | `index: false, follow: false` ✅ |

- [x] `app/book/layout.tsx` — `robots: { index: false, follow: false }`.
- [x] `app/my/layout.tsx` — `robots: { index: false, follow: false }`.
- [x] App 404 (`app/app/not-found.tsx`) inherits noindex from `app/app/layout.tsx`.

---

## 5. Middleware / proxy (`proxy.ts`)

- [x] Matcher excludes `robots.txt`, `sitemap.xml`, `llms.txt`, `favicon.ico`, static images from auth middleware.
- [x] `/` remains in `isPublicRoute()` — crawlers without cookies get 200.
- [ ] No Cloudflare/Vercel bot fight mode on `bookedfox.com` (owner verifies dashboard).

---

## 6. Root marketing layout (`app/layout.tsx`)

- [x] `robots: { index: true, follow: true }` on root layout (marketing default).
- [x] `alternates.canonical` resolves to `https://bookedfox.com` for `/`.
- [x] `/privacy` and `/terms` set canonical + `index: true`.

---

## 7. Tests & docs

- [x] `npm run smoke:seo` with checks for robots + sitemap + homepage index.
- [x] `docs/marketing/seo-geo-playbook.md` § Indexation policy.
- [x] Launch checklist items in `tasks/launch-checklist.md`.

---

## Acceptance criteria

- [x] Local: Googlebot can fetch `/`, `/robots.txt`, `/sitemap.xml` without auth or 404.
- [x] Local: `/sign-in` returns `noindex` in HTML **and** `/app/` under `Disallow` in robots.txt.
- [x] Local: Sitemap contains exactly **3** marketing URLs on `bookedfox.com`.
- [ ] Production: all three acceptance criteria verified on `bookedfox.com` after deploy.
