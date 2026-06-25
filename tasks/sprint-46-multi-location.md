# Sprint 46 — Multi-location

> **Status:** ✅ Complete  
> **Phase:** 6 (P2 post-parity)  
> **ADR:** `docs/adr/0008-multi-location-v1.md`

---

## Locked v1 scope

- Single `/book/[slug]`; location picker when 2+ active locations
- Shared CRM; org-wide services & availability
- Org-level service-area enforcement (sprint 45)
- No location RBAC; default location synced from business profile

## Done

### Data model

- [x] `Location` model + migration `20250628140000_sprint_46_multi_location`
- [x] `BookingRequest.locationId`, `Job.locationId` + backfill default per org

### Owner UI

- [x] Settings → Locations CRUD (`/app/settings/locations`)
- [x] Default location synced on business profile save + onboarding

### Booking & scheduling

- [x] Public booking location picker (2+ locations)
- [x] Manual booking location dropdown
- [x] `locationId` on booking create → job create

### Tests & docs

- [x] `npm run smoke:locations`
- [x] `docs/07-data-model.md`, ADR 0008

## Out of scope (v1)

- Per-location booking slugs, services, availability, enforcement
- Calendar/scheduler filter by location (46.1)
- Franchise billing, cross-location crew rules

## Validation

- [x] `npm run typecheck`, `npm run lint`, `npm run build`
- [x] `npm run smoke:locations`, `smoke:manual-booking`, `smoke:public-booking-parity`
