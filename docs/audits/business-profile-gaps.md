# Business profile & onboarding — gap analysis vs ConvertLabs

**Updated:** 2026-06-25  
**CL references:** `/company`, onboarding wizard (`onboarding-wizard.md`), profile menu  
**UpNext routes:** `/sign-up`, `/app/onboarding`, `/app/settings/business`  
**Scheduled work:** sprints **35–36** (this doc) · sprints **37–42** in `docs/audits/product-gaps-roadmap.md`

---

## Executive summary

| Area | vs CL | UpNext today | Next sprint |
|------|-------|--------------|-------------|
| Company profile fields | `/company` | Settings → Business (sectioned form) | ✅ **35** — logo, website |
| Service area | Places-driven / structured | Coverage selector (onboarding + settings) | ✅ **35** |
| Address capture | Google Places | Places autocomplete + manual fallback | ✅ **36** |
| Industry onboarding | Visual cards | Industry card grid step 1 | ✅ **36** |
| Logo / branding | Upload on company | Logo upload + public booking | ✅ **35** |
| Website | On company profile | `websiteUrl` on profile + booking page | ✅ **35** |
| Business name | AI suggestions (CL only) | Sign-up + onboarding step 3 (Option A dedup) | ✅ **36** |
| Service geo zones | Possible in Service Studio | Display string only | **Backlog** (P2) |
| Branding colors | Settings → Branding | Not built | **Backlog** (P2) |
| Editable booking slug | May allow change | Read-only | **Backlog** (intentional) |

---

## Field matrix

| Field | CL | Sign-up | Onboarding | Settings → Business | Gap |
|-------|-----|---------|------------|---------------------|-----|
| Owner name | ✅ | ✅ | — | — | — |
| Business name | ✅ (CL: AI suggestions) | ✅ | Step 3 (prefill + helper) | ✅ | ✅ Option A dedup |
| Email | ✅ | ✅ | — | ✅ | — |
| Industry / service type | Cards | — | Step 1 cards | ✅ select | ✅ cards in onboarding |
| Team size | ✅ | — | Step 1 | ✅ | — |
| Street address | Places | — | Step 2 Places | ✅ Places | ✅ **36** |
| City / state / ZIP | Places | — | Step 2 | ✅ | ✅ **36** |
| Service area | From location | — | Step 3 coverage | ✅ coverage + preview | ✅ **35** |
| Timezone / currency | ✅ | — | Step 3 | ✅ | — |
| Phone / description | ✅ | — | Step 3 | ✅ | — |
| Logo | ✅ | — | — | ✅ upload | ✅ **35** |
| Website | ✅ | — | — | ✅ | ✅ **35** |
| Public slug | Shown | Auto | Preview step 4 | Read-only | Defer |
| Catalog seed | Silent | — | Step 4 preview | — | ✅ **Wedge** |

---

## Internal inconsistencies (resolved sprint 35–36)

1. ~~**Service area**~~ — Shared `ServiceAreaFields` in onboarding + settings.
2. ~~**Validator**~~ — `businessSettingsSchema` fixed for settings-only fields.
3. ~~**R1 logo**~~ — Upload UI + public booking display.

## Sign-up vs onboarding business name (Option A)

Sign-up collects **business name** (creates org slug). Onboarding step 3 pre-fills `displayName` from sign-up and shows helper copy when unchanged: *"From your account setup — edit if this isn't how customers should see you."* No second blind prompt; user may correct the public-facing name once.

---

## Intentional omissions (do not schedule)

- SaaS billing card in onboarding wizard (different product model)
- **AI business name suggestions** (CL feature — intentionally omitted per `docs/adr/0005-mvp-scope-boundaries.md`)
- Website builder / WordPress hub
- Multi-location company profiles
- Service-area **enforcement** on slots (CL may zone-match; MVP uses display label only)

---

## Validation

| Sprint | Smoke / test |
|--------|----------------|
| 35 | `npm run smoke:business-profile` |
| 36 | `npm run smoke:address-autocomplete` (env: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`) |
| Both | `npm run smoke:launch-onboarding`, `npm run build` |

---

## Related docs

- `docs/portal-review-qa.md` — onboarding vs CL table
- `tasks/competitor-parity-status.md` — §5 Onboarding & activation
- `tasks/competitor-parity-audit-plan.md` — Parts 10–11
