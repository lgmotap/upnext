# Pricing parameters (bed / bath)

Cleaning services can charge extra per bedroom and bathroom above included counts.

## Data model

- `ServicePricingParameter` — per-service config (`bedrooms` / `bathrooms`, unit price, included units, max)
- `BookingRequestParameter` — customer-selected counts on a booking request
- Accepted job `priceCents` = base + add-ons + parameter surcharges

## Owner setup

**Services → Edit service → Bedroom / bathroom pricing**

Residential cleaning catalog seeds defaults: 2 bedrooms + 1 bathroom included; +$15/bed, +$20/bath extra.

## Booking flows

Public `/book/[slug]` and manual `/app/bookings/new` show a **Home size** step when the service has parameters. Totals update live.

## Smoke

```bash
npm run smoke:pricing-params
```
