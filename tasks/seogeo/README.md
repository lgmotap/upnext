# SEO / GEO Sprints — BookedFox Marketing (`bookedfox.com`)

**Purpose:** Ship and maintain technical SEO, Generative Engine Optimization (GEO), and crawl hygiene for the **marketing site only**. The SaaS product (`/app/*`, `/crew/*`, tenant booking, portals) must **never** be indexed on `bookedfox.com`.

**Playbook:** `docs/marketing/seo-geo-playbook.md`  
**Agent rule:** `.cursor/rules/130-seo-geo-marketing.mdc`  
**Config source of truth:** `lib/config.ts` (`site`, `phase`, `seo`, `faqs`, `marketingRoutes`)

---

## Indexation policy (non-negotiable)

| URL pattern | Index? | Notes |
|-------------|--------|-------|
| `https://bookedfox.com/` | ✅ Yes | Waitlist landing now → full marketing landing at launch |
| `https://bookedfox.com/privacy` | ✅ Yes | Legal |
| `https://bookedfox.com/terms` | ✅ Yes | Legal |
| `/app/*` | ❌ No | Product workspace — `robots` meta + `robots.txt` |
| `/crew/*` | ❌ No | Field app |
| `/api/*` | ❌ No | APIs |
| `/sign-in`, `/sign-up`, `/forgot-password`, `/auth/*` | ❌ No | Auth |
| `/book/*` | ❌ No | Tenant public booking (not marketing) |
| `/my/*` | ❌ No | Customer portals |
| `/book/*/embed` | ❌ No | Embeds |

**Canonical host:** `https://bookedfox.com` (no `www` unless redirected consistently).

---

## Sprint order

Run **SEO-01 → SEO-04** before public marketing push. **SEO-05** runs once when flipping `phase` from `"waitlist"` to `"launch"`. **SEO-06** is ongoing ops.

**Status (2026-06-26):** SEO-01–04 code complete; sprint checkboxes updated in each file. SEO-06 partial (`smoke:seo`, `llms.txt`, layout audit). **Production deploy + GSC = owner.** SEO-05 at launch.

| Sprint | File | Theme | Status |
|--------|------|-------|--------|
| **SEO-01** | [sprint-seo-01-indexation-baseline.md](./sprint-seo-01-indexation-baseline.md) | robots, sitemap, noindex gates | ✅ Code done — [ ] production verify |
| **SEO-02** | [sprint-seo-02-metadata-open-graph.md](./sprint-seo-02-metadata-open-graph.md) | Title, description, OG | ✅ Done — [ ] OG preview on prod |
| **SEO-03** | [sprint-seo-03-json-ld-entities.md](./sprint-seo-03-json-ld-entities.md) | Schema.org graph | ✅ Done — [ ] Rich Results on prod |
| **SEO-04** | [sprint-seo-04-geo-content-structure.md](./sprint-seo-04-geo-content-structure.md) | SSR FAQ, semantic lists | ✅ Done |
| **SEO-05** | [sprint-seo-05-launch-phase-transition.md](./sprint-seo-05-launch-phase-transition.md) | Full landing (no waitlist) | ⏳ At product launch |
| **SEO-06** | [sprint-seo-06-crawl-hardening-monitoring.md](./sprint-seo-06-crawl-hardening-monitoring.md) | smoke:seo, llms.txt, GSC | 🟡 Automated checks done; GSC owner |

---

## Phase model (`lib/config.ts`)

```ts
export type LaunchPhase = "waitlist" | "launch";
export const phase: LaunchPhase = "waitlist";
```

| Concern | `waitlist` | `launch` |
|---------|------------|----------|
| Primary CTA | Join waitlist (`#waitlist`) | Start free / Sign up (`/sign-up`) |
| Meta description CTA | “Join the free waitlist…” | “Start free — no credit card…” |
| Schema `offers.availability` | `https://schema.org/PreOrder` | `https://schema.org/InStock` |
| Schema `offers.description` | Early-access waitlist | Free trial / self-serve signup |
| Hero / FinalCTA copy | From `waitlistForm`, `cta` | Launch strings in `cta` (swap in config) |
| Sitemap URLs | `/`, `/privacy`, `/terms` only | Same (marketing routes only) |

**Rule:** Never hardcode waitlist copy in components — always read `phase` + `lib/config.ts`.

---

## Validation (every SEO sprint)

```bash
npm run smoke:seo          # after SEO-06 adds script
npm run typecheck
npm run build
```

Manual post-deploy:

```bash
curl -sI https://bookedfox.com/ | grep -i robots
curl -s https://bookedfox.com/robots.txt
curl -s https://bookedfox.com/sitemap.xml
```

---

## Traceability

- Launch checklist: `tasks/launch-checklist.md` § Marketing SEO
- Audit source: Technical SEO / GEO audit (2026-06-26)
