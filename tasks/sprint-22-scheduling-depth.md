# Sprint 22 — Scheduling depth (buffers, carry-over, frequency discounts)

> CL: Settings → Time & Scheduling (carry-over, arrival window) · Service Studio → Frequencies tab (% / $ off).

## Schema

- [x] `BusinessProfile.bufferMinutesBetweenJobs` — default 0, org-wide gap after each job end
- [x] `BusinessProfile.providerCarryOverMinutes` — optional travel/setup time added to slot duration (CL “carry-over”)
- [x] `ServiceFrequencyDiscount` or JSON on `Service` — per-frequency `percentOff` / `amountOffCents` (weekly, biweekly, monthly)

## Slot engine

- [x] `lib/availability/slots.ts` — exclude slots that overlap existing jobs + buffer
- [x] Apply carry-over to effective job duration when calculating slot fit
- [x] Manual booking + public booking respect buffer (org-level MVP; per-worker buffer defer)
- [x] `npm run smoke:booking` extended — two back-to-back jobs cannot book same worker without buffer

## Pricing

- [x] Frequency step shows discount badge when configured (e.g. “Save 10% on weekly”)
- [x] `priceCents` on `BookingRequest` / accepted job reflects discount
- [x] Service editor — optional discount per frequency (cleaning catalog seeds sensible defaults)

## Owner UI

- [x] `/app/settings/availability` — buffer minutes + carry-over fields with help text
- [x] `/app/services` — frequency discounts subsection when service has recurring enabled

## Validation

- [x] `npm run smoke:scheduling-depth` (new) — buffer blocks conflict, discount applied
- [x] `npm run smoke:booking` + `npm run smoke:manual-booking` green
