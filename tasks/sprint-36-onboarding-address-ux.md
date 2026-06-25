# Sprint 36 — Onboarding & address UX (CL wizard polish)

> Closes guided-location and industry-selection gaps vs ConvertLabs onboarding.  
> Depends on sprint 35 (`ServiceAreaFields` shared).

## Scope

### Google Places autocomplete

- [x] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (browser-safe) + server docs in `docs/architecture/`
- [x] Places autocomplete on onboarding step 2 (street → city, state, ZIP fill)
- [x] Same component on Settings → Business address section
- [x] Optional: public booking customer address step (`PublicBookingClient.tsx` details step) — same `AddressAutocomplete` component
- [x] Graceful fallback when API key missing (manual fields unchanged)

### Industry selection UX

- [x] Replace step 1 dropdowns with visual **industry cards** (+ team size select or second row)
- [x] Keep `serviceTypes` / `teamSizes` from `lib/config` as source of truth
- [x] Mobile-friendly grid; selected state matches onboarding visual language

### Sign-up flow dedup

- [x] Document chosen approach in sprint PR / `docs/portal-review-qa.md`:
  - **Option A:** Sign-up collects business name only; onboarding step 3 is edit-with-preview
  - **Option B:** Skip business name on sign-up; collect in onboarding step 3 only
- [x] Implement one option; avoid asking twice without explanation

**Chosen: Option A** — sign-up keeps business name (needed for org slug); onboarding step 3 pre-fills with helper text when unchanged.

### Tests & docs

- [x] `scripts/smoke-address-autocomplete.ts` — manual-field fallback without key; with key if env set
- [x] `npm run smoke:address-autocomplete` in `package.json`
- [x] Update `docs/audits/business-profile-gaps.md` checklist

## Out of scope

- **AI-generated business name suggestions** — CL feature; not in UpNext scope (`docs/adr/0005-mvp-scope-boundaries.md`)
- Service-area zip/radius enforcement
- Country other than US (keep `US_REGIONS` until i18n sprint)

## Validation

- [x] `npm run smoke:address-autocomplete`
- [x] `npm run smoke:launch-onboarding`
- [x] `npm run typecheck` + `npm run build`
