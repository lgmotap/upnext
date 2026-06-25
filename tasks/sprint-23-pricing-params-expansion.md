# Sprint 23 — Pricing parameters expansion (half-bath, sq ft)

> CL: Service Studio → Pricing Parameters — Bathrooms, Half-Bathrooms, Square Feet @ $/unit.

## Schema

- [x] Extend `PricingParameterType` enum: `half_bathrooms`, `square_feet`
- [x] Migration for new enum values (no data loss on existing bed/bath rows)

## Catalog & services

- [x] Industry catalog (residential cleaning) seeds half-bath + sq ft where CL trial had them
- [x] `/app/services` editor — enable/configure all parameter types per service
- [x] `includedUnits` / `maxUnits` validation per type (sq ft cap e.g. 10000)

## Booking flows

- [x] Public `/book/[slug]` — render controls for enabled params (stepper or select per CL pattern)
- [x] Manual booking — same fields + live price preview
- [x] Confirmation + job detail show parameter breakdown

## Validation

- [x] Extend `npm run smoke:pricing-params` — half-bath + sq ft price math
- [x] `npm run smoke:bed-bath-form-defaults` if present — update for full matrix
