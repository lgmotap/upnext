# Sprint 46 — Multi-location

> **Status:** 📋 Planning (not started)  
> **Phase:** 6 (P2 post-parity)  
> **Backlog:** `tasks/backlog.md`  
> **Blocked by:** ADR scope review — `docs/adr/0005-mvp-scope-boundaries.md` defers multi-location  
> **Depends on:** Sprint 45 recommended first (org-wide service area before per-location zones)

---

## Current state

- **One org = one business** — single `BusinessProfile`, one `publicSlug`, one booking URL
- All tenant data scoped by `organizationId` only — no `Location` entity
- Team, services, availability, calendar, scheduler — org-wide
- `docs/02-mvp-scope.md` and ADR 0005 explicitly exclude multi-location

## Planning goals (before scope checkboxes)

1. Define **minimum viable multi-location** vs CL enterprise (locations, separate booking pages, per-location hours?)
2. Decide **data model:** `Location` table + `locationId` on which entities (Service, Job, AvailabilityRule, BusinessProfile?)
3. Migration path for existing single-location orgs (default location row)
4. Impact on sprint 45 radius enforcement (per-location origin coords)
5. Auth/RBAC: can workers see only their location?

## Scope (TBD — fill after planning session)

### Data model

- [ ] ADR amendment or `docs/adr/0007-post-mvp-p2-scope.md` update
- [ ] `Location` model + migration
- [ ] Backfill default location for existing orgs

### Owner UI

- [ ] Settings → Locations CRUD (or Business → Locations tab)
- [ ] Per-location address, timezone, service area enforcement
- [ ] Optional per-location booking slug or `?location=` param

### Booking & scheduling

- [ ] Public booking location picker (when org has 2+ locations)
- [ ] Services/availability scoped or shared per location
- [ ] Calendar/scheduler filter by location

### Tests & docs

- [ ] Smoke script TBD
- [ ] Update `docs/07-data-model.md`

## Out of scope (initial)

- Franchise / billing per location
- Cross-location crew sharing rules (complex)
- Route optimization across locations

## Validation

- [ ] TBD after scope lock
- [ ] `npm run typecheck` + `npm run build`

## Open questions (PO)

1. Is v1 **2–5 locations same brand** enough, or full CL parity?
2. Separate booking URLs per location vs single page with picker?
3. Shared customer CRM across locations?
4. Pricing: included in base plan or add-on tier?
