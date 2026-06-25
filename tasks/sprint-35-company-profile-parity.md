# Sprint 35 — Company profile parity (CL `/company`)

> Closes profile gaps after structured Settings → Business rework.  
> Audit: `docs/audits/business-profile-gaps.md`

## Context (partially shipped)

- Settings → Business: sectioned form (Industry, Address, Service area, Public profile)
- `businessSettingsSchema` fixed — no longer requires onboarding-only fields on save
- Service area: coverage selector + live preview in settings only

## Scope

### Service area — unify onboarding + settings

- [x] Extract shared `ServiceAreaFields` in `components/app/` (coverage, custom label, preview)
- [x] Use in `BusinessProfileForm` and `OnboardingWizard` step 3
- [x] Remove free-text `serviceArea` input from onboarding; derive from step 2 city/state + coverage
- [x] On onboarding finish, persist same `serviceArea` format as settings (`lib/business/service-area.ts`)

### Logo (R1)

- [x] Logo upload on `/app/settings/business` → Supabase Storage → `BusinessProfile.logoUrl`
- [x] Remove / replace logo action
- [x] Show logo on public booking page header when set (`/book/[slug]`)
- [x] Owner-only; validate file type + size server-side

### Website

- [x] `websiteUrl` field on business profile form + validator + `updateBusinessSettings`
- [x] Optional link on public booking page (external, `rel="noopener"`)

### Tests & docs

- [x] `scripts/smoke-business-profile.ts` — save profile with address + service area scope + optional website
- [x] `npm run smoke:business-profile` in `package.json`
- [x] Update `docs/portal-review-qa.md` service area row
- [x] Update `tasks/competitor-parity-status.md` §4 Settings — business

## Out of scope (sprint 36+)

- Google Places autocomplete
- Industry card grid
- **AI business name suggestions** — not planned
- Branding colors / theme editor
- Editable `publicSlug`

## Validation

- [x] `npm run smoke:business-profile`
- [x] `npm run smoke:launch-onboarding`
- [x] `npm run typecheck` + `npm run build`
