# ADR 0008: Multi-location v1 (Sprint 46)

**Status:** Accepted  
**Date:** 2026-06-25  
**Supersedes:** Multi-location deferral in ADR 0005 for Phase 6 only

## Decision

Ship **multi-location v1** for 2–10 branches under one org:

| Area | v1 behavior |
|------|-------------|
| Booking URL | Single `/book/[slug]`; location picker when 2+ active locations |
| CRM | Shared customers org-wide |
| Services & availability | Org-wide (not per-location in v1) |
| Service-area enforcement | Org-level on `BusinessProfile` (sprint 45); per-location geo deferred |
| Workers | See all org jobs (no location RBAC in v1) |
| Default location | Auto-created from business profile; backfilled for existing orgs |

## Data model

- `Location` — name, address, phone, optional timezone override, `isDefault`, `isActive`
- `BookingRequest.locationId`, `Job.locationId` — required after backfill (nullable in schema for migration safety)

## Out of scope (v1)

- Per-location booking slugs / custom domains
- Per-location services, availability, or enforcement
- Franchise billing, cross-location crew rules, route optimization

## Why

Operators with 2–5 territories need jobs tagged by branch for dispatch and reporting without a second org account.

## Consequences

- Settings → Locations CRUD
- Public + manual booking pass `locationId`
- Calendar filter by location deferred to 46.1
