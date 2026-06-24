# Sprint 15 — Pricing parameters (cleaning wedge)

> CL: Service Studio → Pricing Parameters (bedrooms, bathrooms @ $/unit).

## Schema

- [x] `ServicePricingParameter` or JSON on `Service` — `parameterType` (bedrooms, bathrooms), `unitPriceCents`, `includedUnits`, `maxUnits`
- [x] `BookingRequest` / job — store selected parameter values

## Public + manual booking

- [x] Optional bed/bath step when service has parameters enabled
- [x] Price preview updates live
- [x] Manual booking includes parameters
- [x] Accepted job `priceCents` reflects parameters

## Owner

- [x] Service editor — enable parameters per service (cleaning defaults)
- [x] Industry catalog seeds parameters for residential cleaning

## Validation

- [x] `npm run smoke:pricing-params`
