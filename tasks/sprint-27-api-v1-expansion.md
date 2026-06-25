# Sprint 27 — API v1 expansion

> CL: `api-reference.md` — read catalog sync beyond bookings/customers/services.

## New read endpoints

- [x] `GET /api/v1/availability` — query `date`, `serviceId`, `durationMinutes` → slot list (org TZ)
- [x] `GET /api/v1/extras` — list addons for org (alias services where `isAddon`)
- [x] `GET /api/v1/frequencies` — org frequency options + discount metadata (after sprint 22)
- [x] `GET /api/v1/categories` — service groups from catalog
- [x] `GET /api/v1/company` — business profile public fields (name, timezone, currency, logo)
- [x] `GET /api/v1/settings` — booking policies: `minNoticeHours`, cancel policy, buffer (read-only subset)

## Consistency

- [x] Shared response envelope with existing v1 (`data`, `meta`, cursor where applicable)
- [x] Same Bearer auth + 60 req/min rate limit as sprint 20
- [x] OpenAPI-style comment block in `docs/` or README API section (not full Redoc)

## Webhooks (optional add)

- [x] `booking.canceled` event — align with CL fifth event if not already delivered

## Validation

- [x] Extend `npm run smoke:api` — hit all new routes with test key
- [x] Tenant isolation — key A cannot read org B
