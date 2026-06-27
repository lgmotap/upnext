# Sprint SEO-05 — Launch phase transition (full landing, no waitlist)

> **Goal:** When product goes public, flip `phase` from `"waitlist"` to `"launch"` and update **all** SEO/GEO surfaces in one coordinated change — without indexing `/app/*`.

**Trigger:** Product ready for self-serve signup; waitlist closed or secondary.  
**Single switch:** `lib/config.ts` → `export const phase: LaunchPhase = "launch";`

---

## Pre-flight checklist

- [ ] SEO-01 through SEO-04 complete and green on production.
- [ ] `/sign-up` flow tested end-to-end.
- [ ] `cta.primary` in config updated to launch labels/hrefs (not `#waitlist`).
- [ ] Announcement bar copy updated or removed for launch.
- [ ] Resend / onboarding emails reference launch, not waitlist.

---

## 1. `lib/config.ts` — phase flip

```ts
export const phase: LaunchPhase = "launch";

export const cta = {
  primary: { label: "Start free", href: "/sign-up" },
  compact: { label: "Start free", href: "/sign-up" },
  secondary: { label: "See features", href: "#features" },
  // …
};
```

- [ ] Update `seoMeta.launch` strings (SEO-02) — no “waitlist” in title/description.
- [ ] Replace `waitlistForm` section on page OR repurpose `#waitlist` anchor to `#signup` / remove waitlist block entirely.
- [ ] `announcement` badge/message for launch (or disable bar).

---

## 2. Metadata swap (automatic via `getSeoMeta(phase)`)

| Field | Waitlist | Launch |
|-------|----------|--------|
| `title` | `BookedFox \| Home Service Booking Software` | Same or `BookedFox \| Get Booked Online` |
| `description` | “Join the free waitlist…” | “Start free — online booking for cleaners, lawn care & handyman teams. No credit card required.” |
| `og:title` | Waitlist-oriented | Product-value oriented |

- [ ] Verify `app/page.tsx` reads `phase` — no hardcoded waitlist metadata.
- [ ] Run smoke: title/description char limits still pass.

---

## 3. JSON-LD — SoftwareApplication offers

**Waitlist:**

```json
"availability": "https://schema.org/PreOrder",
"description": "Early-access waitlist"
```

**Launch:**

```json
"availability": "https://schema.org/InStock",
"description": "Free trial — self-serve signup",
"price": "0",
"priceCurrency": "USD"
```

- [ ] Implement in `getSchemaOffers(phase)` — no manual edits in `JsonLd.tsx`.
- [ ] Remove “waitlist” language from `SoftwareApplication.description` if duplicated; keep factual product description.
- [ ] Re-validate Rich Results after deploy.

---

## 4. On-page content (GEO)

- [ ] Hero CTA → “Start free” / `/sign-up`.
- [ ] `FinalCTA`, `Waitlist` section → replace with signup CTA or pricing teaser (MVP: CTA only).
- [ ] FAQ entries to update in `faqs`:
  - [ ] “Is the product available now?” → Yes, with signup link.
  - [ ] “Does joining the waitlist cost anything?” → Remove or replace with pricing FAQ.
  - [ ] Add “How much does BookedFox cost?” if pricing public.
- [ ] JSON-LD FAQPage auto-updates when `faqs` array changes.

---

## 5. Sitemap & robots — unchanged scope

- [ ] Sitemap still **only** `/`, `/privacy`, `/terms`.
- [ ] **Do not** add `/sign-up` to sitemap (noindex auth — SEO-01).
- [ ] robots.txt unchanged disallow list.

---

## 6. Indexation guardrails (must not regress)

- [ ] `/app/*` still `noindex` after launch.
- [ ] Marketing `/` still `index: true`.
- [ ] Spot-check: `curl -s https://bookedfox.com/app/dashboard` contains `noindex`.

---

## 7. Post-launch comms

- [ ] Submit updated sitemap in Google Search Console.
- [ ] Request re-index of `https://bookedfox.com/` (URL Inspection).
- [ ] Update `CHANGELOG.md` + `HANDOFF.md` with launch date and phase.
- [ ] Social posts use OG image URL (verify preview).

---

## 8. Rollback plan

If launch delayed:

1. Revert `phase` to `"waitlist"`.
2. Redeploy — metadata and schema revert via config.
3. Do not remove waitlist API route until data migrated.

---

## Acceptance criteria

1. One-line phase flip updates meta, schema, and CTAs.
2. No mention of “waitlist” in `<title>`, meta description, or `offers.availability` on production.
3. `/app/*` remains non-indexable.
