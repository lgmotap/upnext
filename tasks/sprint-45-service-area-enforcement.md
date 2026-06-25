# Sprint 45 — Service-area zip lists / radius enforcement

> **Status:** ✅ Complete (Jun 2026)  
> **Phase:** 6 (P2 post-parity)  
> **Backlog:** `tasks/backlog.md`  
> **Audit:** `docs/audits/business-profile-gaps.md` · `docs/audits/product-gaps-roadmap.md` § Phase 6  
> **Depends on:** Sprints 35–36 (service area display + Places address)  
> **ADR:** `docs/adr/0007-post-mvp-p2-scope.md`

---

## Current state

- `BusinessProfile.serviceArea` — display string only (booking page, sidebar, SEO)
- `ServiceAreaFields` — coverage label (`city_state` / `metro` / `custom`); no enforcement
- Public + manual booking — slot/conflict checks only; **no geo validation**
- No lat/lng on business profile or customer addresses

## Product decisions (lock before Step 1)

| # | Decision | Locked value |
|---|----------|--------------|
| 1 | Modes | `off` \| `zip_list` \| `radius` (default `off`) |
| 2 | Public booking | Hard block + phone CTA |
| 3 | Manual booking | Warn + owner/admin/dispatcher override |
| 4 | Slot filtering by geo | **No** in v1 — validate on submit |
| 5 | Onboarding enforcement UI | Settings-only v1 |

**Open PO questions:** waitlist vs block-only, radius default miles, server geocode key — see § Open questions below.

---

## Scope

### Schema & lib

- [x] `ServiceAreaEnforcementMode` enum + fields on `BusinessProfile` (mode, zip JSON, radius miles, HQ lat/lng)
- [x] Prisma migration + generate
- [x] `lib/business/service-area-enforcement.ts` — normalize US zip, haversine, `checkServiceArea`
- [x] Unit tests: `tests/unit/service-area-enforcement.test.ts`

### Settings & HQ coordinates

- [x] `server/validators/business.ts` — enforcement fields on profile save
- [x] Persist HQ lat/lng on business address save (Places geometry or server geocode)
- [x] `lib/maps/geocode-address.ts` (server-only, env-gated)
- [x] `components/app/ServiceAreaEnforcementFields.tsx` — zip textarea + radius input
- [x] Wire into `BusinessProfileForm` (default off; onboarding unchanged)

### Booking enforcement

- [x] `server/services/service-area.ts` — load config + check helper
- [x] Hook `createPublicBooking` — block when out of area
- [x] Hook `createManualBooking` — warn; accept `overrideServiceArea` for dispatcher+
- [x] `server/actions/service-area-check.ts` — public pre-check (rate limited)
- [x] `PublicBookingClient` — inline out-of-area error on details submit
- [x] `ManualBookingClient` — override confirm dialog

### Tests & docs

- [x] `scripts/smoke-service-area-enforcement.ts` + `npm run smoke:service-area-enforcement`
- [x] Update `docs/07-data-model.md`, `business-profile-gaps.md`, `CHANGELOG.md`
- [x] `npm run smoke:business-profile` + `smoke:manual-booking` + `smoke:public-booking-parity` regression

---

## Out of scope

- Map polygon / draw-on-map zones
- Multi-location (sprint 46)
- Filter available days/slots by customer location
- Per-service zone overrides
- Canadian/international postal rules (US-first v1)
- Public API booking create (not built)

---

## Validation

- [x] `npm run db:validate`
- [x] `npm run smoke:service-area-enforcement`
- [x] `npm run typecheck` + `npm run lint` + `npm run build`

---

## Implementation order

See detailed steps in § Detailed spec below.

---

## Open questions (PO)

1. Hard block only, or “notify me” waitlist for out-of-area?
2. Default radius preset (15 / 25 / 30 mi)?
3. Show zip list on public booking page, or marketing label only?
4. OK to add `GOOGLE_MAPS_SERVER_API_KEY` for geocoding?

---

## Detailed spec

Today UpNext stores a **display-only** service area string on `BusinessProfile.serviceArea`. Customers see it on the booking page and sidebar, but **nothing validates** whether the address they enter is inside that coverage.

ConvertLabs may zone-match in Service Studio (exact spec not captured in repo). Home-service operators commonly need either:

1. **ZIP allowlist** — “We serve these zip codes” (deterministic, no API cost).
2. **Radius from HQ** — “We serve within N miles of our shop” (needs coordinates).

This sprint adds **optional enforcement** configured in Settings → Business, applied on **public booking** and **manual booking** (with owner override). Default remains **off** so existing orgs are unchanged.

---

## Current state (code audit)

### What exists

| Layer | File(s) | Behavior |
|-------|---------|----------|
| Display label | `BusinessProfile.serviceArea` (string) | Shown on `/book/[slug]`, sidebar, SEO meta |
| Scope UI | `components/app/ServiceAreaFields.tsx` | Coverage: `city_state` \| `metro` \| `custom` → formatted string |
| Pure helpers | `lib/business/service-area.ts` | `formatServiceAreaDisplay`, infer scope from saved string |
| Validators | `server/validators/service-area-form.ts` | Ensures non-empty display label on save |
| Onboarding | `OnboardingWizard.tsx` step 3 | Same coverage selector as settings |
| Settings | `BusinessProfileForm.tsx` | Saves `serviceArea` via `computeServiceAreaDisplay` |
| Business address | `BusinessProfile.addressLine1`, `city`, `region`, `postalCode` | Full street address; **no lat/lng** |
| Customer address | `CustomerAddress.postalCode` + street fields | Captured on public/manual book; **no lat/lng** |
| Places | `AddressAutocompleteFields`, `parseGoogleAddressComponents` | Fills line1/city/region/ZIP; **does not persist coordinates** |
| Booking create | `createPublicBooking`, `createManualBooking` in `server/services/bookings.ts` | Slot + conflict checks only; **no geo validation** |
| API | `GET /api/v1/company` | Returns `serviceArea` string only |

### What does NOT exist

- Enforcement mode enum or config JSON on profile
- ZIP allowlist storage or editor
- Radius miles + origin coordinates
- `isAddressInServiceArea()` helper
- Public booking “out of area” UX
- Manual booking warning / override
- Smoke coverage for enforcement paths
- Geocoding fallback when Places is disabled

### Intentional prior deferral

`docs/audits/business-profile-gaps.md`:

> Service-area **enforcement** on slots (CL may zone-match; MVP uses display label only)

---

## vs ConvertLabs (known)

| CL (inferred) | UpNext today | Sprint 45 target |
|---------------|--------------|------------------|
| Service Studio geo zones possible | Display string only | Configurable zip and/or radius |
| Booking may reject out-of-zone | No rejection | Block public book + warn on manual |
| Company address as zone anchor | Address stored, unused for geo | HQ lat/lng as radius origin |

**Research gap:** No captured CL screenshot/spec for zone editor UI. Plan uses UpNext-native UX (simple, no map polygon editor in v1).

---

## Product decisions (propose — lock before build)

### P0 — Must decide

| # | Decision | Recommendation | Rationale |
|---|----------|----------------|-----------|
| 1 | Enforcement modes | **`off` \| `zip_list` \| `radius`** (single active mode) | Matches backlog wording; avoid combinatorial UX |
| 2 | Default for new orgs | **`off`** | Zero regression; owner opts in |
| 3 | Public booking behavior | **Hard block** with friendly message + link to call business | Prevents bad leads; CL-like |
| 4 | Manual booking behavior | **Warn + allow override** checkbox for owner/admin/dispatcher | Phone bookings sometimes need exceptions |
| 5 | Portal rebook / prefill | **Same rules as public booking** | Consistent customer experience |
| 6 | Slot API before address | **Do not filter slots by geo** in v1 | Address collected late in funnel; geo on submit only |
| 7 | ZIP matching | **US 5-digit primary**; normalize `78701-1234` → `78701`; case-insensitive | Matches current US-first address stack |
| 8 | Radius without Maps key | **Disable radius mode in UI** unless HQ has lat/lng OR show setup blocker | Avoid silent failures |
| 9 | Display label vs enforcement | **Keep existing `serviceArea` string** for marketing copy; enforcement is separate config | “Greater Austin” label can coexist with zip list |

### P1 — Can defer within sprint or to 45.1

| # | Decision | Defer? |
|---|----------|--------|
| 10 | Canadian postal codes / international | Yes — US-only v1 |
| 11 | Per-service zone overrides | Yes — org-wide only |
| 12 | “Suggest nearest served zip” on failure | Nice-to-have |
| 13 | Bulk import zips from CSV | Textarea paste is enough for v1 |
| 14 | Store lat/lng on `CustomerAddress` for repeat checks | Optional optimization |

---

## Scope

### In scope

1. **Schema** — enforcement config on `BusinessProfile` (+ optional `ServiceAreaZip` table if list is large)
2. **Settings UI** — extend Service area section: mode toggle, zip textarea/tags, radius slider/input, HQ coordinate status
3. **Persist HQ coordinates** when business address saved via Places (extend place parse flow) or one-time geocode on save when Maps server key available
4. **Pure lib** — `lib/business/service-area-enforcement.ts` (normalize zip, haversine, `checkServiceArea`)
5. **Server validation** — `createPublicBooking`, `createManualBooking` (+ validators)
6. **Public booking UX** — inline error on details step; optional early ZIP blur check (client calls server action)
7. **Manual booking UX** — banner when out of area + “Book anyway” for privileged roles
8. **Smoke** — `scripts/smoke-service-area-enforcement.ts`
9. **Docs** — update `business-profile-gaps.md`, `CHANGELOG.md`, `docs/07-data-model.md`

### Out of scope

- Map polygon / draw-on-map zones (CL-level Service Studio)
- Multi-location per org (see sprint 46 planning — separate tenant model)
- Filtering available days/slots by customer location
- Auto-generating zip list from radius (could be 45.1)
- Service-area-based pricing surcharges
- Public API v1 breaking changes (additive fields OK)

---

## Data model proposal

### Option A — JSON on profile (fastest)

```prisma
enum ServiceAreaEnforcementMode {
  off
  zip_list
  radius
}

model BusinessProfile {
  // existing...
  serviceAreaEnforcementMode ServiceAreaEnforcementMode @default(off)
  serviceAreaRadiusMiles     Int?                        // 1–100 when mode=radius
  serviceAreaZipCodesJson    Json?                       // string[] normalized 5-digit
  addressLatitude            Float?
  addressLongitude           Float?
}
```

**Pros:** One migration, simple reads. **Cons:** Large zip lists in JSON (OK up to ~500 zips).

### Option B — join table (if lists can be huge)

```prisma
model ServiceAreaZip {
  id             String @id @default(cuid())
  organizationId String
  postalCode     String // 5-digit normalized
  @@unique([organizationId, postalCode])
}
```

**Recommendation:** Start with **Option A**; promote to B only if operators paste 1000+ zips.

### Migration behavior

- All existing rows: `serviceAreaEnforcementMode = off`, null coords, null zip JSON.
- No change to `serviceArea` display string.

---

## Library design

### `lib/business/service-area-enforcement.ts` (pure, no Prisma)

```ts
export type ServiceAreaEnforcementConfig = {
  mode: "off" | "zip_list" | "radius";
  zipCodes?: string[];
  radiusMiles?: number;
  originLat?: number;
  originLng?: number;
};

export function normalizeUsZip(input: string): string | null;

export function haversineMiles(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number;

export type ServiceAreaCheckResult =
  | { ok: true }
  | { ok: false; reason: "zip_not_listed" | "outside_radius" | "missing_origin" | "missing_customer_coords" };

export function checkServiceArea(
  config: ServiceAreaEnforcementConfig,
  customer: { postalCode: string; latitude?: number; longitude?: number },
): ServiceAreaCheckResult;
```

### Geocoding strategy (radius mode)

| Step | Source |
|------|--------|
| HQ origin | On business profile save: if Places returns `geometry.location`, persist to `addressLatitude/Longitude`. Else optional server geocode (Maps Geocoding API — **server key**, not in browser). |
| Customer point at book time | **v1:** Geocode server-side from `{line1, city, region, postalCode}` on submit only. Cache not required for v1. |
| No Maps key | Radius mode save blocked with message: “Add Google Maps API key or switch to ZIP list.” ZIP mode works without Maps. |

**Cost note:** One geocode per public booking submit in radius mode — acceptable at MVP volume; add caching in 45.1 if needed.

---

## UI / UX

### Settings → Business → Service area (extend `ServiceAreaFields` or sibling component)

```
Coverage label (existing)     [ City & state ▼ ]
Customers will see: Greater Austin, TX

── Service area enforcement (optional) ──
[ ] Restrict bookings to my service area

When enabled:
  ( ) ZIP codes I serve
      [ textarea: one per line or comma-separated ]
      Preview: 12 ZIP codes

  ( ) Radius from business address
      [ 25 ] miles
      Origin: 123 Main St, Austin TX ✓ (coordinates saved)
      ⚠ Set business address with autocomplete to enable radius

Help: Customers outside this area cannot complete online booking.
Phone bookings can override in Manual Booking.
```

Validation on save:

- `zip_list`: ≥1 valid US zip after normalize
- `radius`: `radiusMiles` 1–100, origin lat/lng present
- `off`: clear zip JSON / ignore radius

### Public booking (`PublicBookingClient.tsx`)

**Flow change:** On details step submit (or ZIP blur debounce):

1. Client calls `checkServiceAreaForBookingAction({ slug, postalCode, ...address })`
2. If `ok: false` → show inline alert:
   > “Sorry, we don’t serve {postalCode} yet. We currently serve {serviceArea}. Questions? Call {phone}.”
3. Do not call `submitPublicBookingAction` until pass.

**Do not** move address before date/time in v1 (large funnel change) — validate at submit.

### Manual booking (`ManualBookingClient.tsx`)

- When existing customer address or new address selected, run same check server-side on submit.
- If fail && role ∈ {owner, admin, dispatcher}: return `{ ok: false, outOfServiceArea: true }` → UI shows confirm dialog with override hidden field `overrideServiceArea=1`.
- Workers cannot manual book (already gated).

---

## Enforcement matrix

| Entry point | Mode off | zip_list | radius |
|-------------|----------|----------|--------|
| Public booking submit | ✅ | Block if ZIP ∉ list | Block if distance > N mi |
| Manual booking submit | ✅ | Warn + override | Warn + override |
| Portal book again prefill | ✅ | Same as public | Same as public |
| Owner accepts pending booking | ✅ (address already stored) | No re-check | No re-check |
| CSV customer import | ✅ | No check | No check |
| API v1 booking create | N/A today | N/A | N/A |

---

## Implementation order

```
Step 1  prisma/schema.prisma — enum + fields + migration
Step 2  lib/business/service-area-enforcement.ts + unit tests (vitest)
Step 3  lib/business/service-area-enforcement.ts — haversine + zip normalize tests
Step 4  server/validators/business.ts — enforcement fields on settings save
Step 5  Persist HQ lat/lng — PlaceAutocompleteLine1 / business save path
Step 6  lib/maps/geocode-address.ts (server-only) — optional Geocoding API wrapper
Step 7  server/services/service-area.ts — load config for org, check helper
Step 8  server/services/bookings.ts — hook createPublicBooking + createManualBooking
Step 9  server/actions/service-area-check.ts — public pre-check action (rate limited)
Step 10 components/app/ServiceAreaEnforcementFields.tsx — settings UI
Step 11 BusinessProfileForm + onboarding step 3 — wire enforcement (default off)
Step 12 PublicBookingClient — error UX + pre-check
Step 13 ManualBookingClient — override UX
Step 14 scripts/smoke-service-area-enforcement.ts
Step 15 Docs + backlog + product-gaps-roadmap
```

---

## Edge cases

| Case | Handling |
|------|----------|
| Empty postal on public form | Existing required field validation |
| ZIP+4 input `78701-1234` | Normalize to `78701` before compare |
| Leading zeros `02108` | Store/compare as string `02108` |
| Business moves address | Re-save profile → update origin coords |
| Enforcement on but empty zip list | Block save in settings |
| Customer uses manual address (no Places) | ZIP mode still works; radius uses server geocode |
| Geocode fails (bad address) | Treat as out of area OR show “verify your address” — **prefer latter** |
| `bookingEnabled = false` | Unchanged; enforcement irrelevant |
| Custom booking host / embed | Same server checks |

---

## Security & permissions

- Settings save: owner/admin only (existing business settings gate).
- `checkServiceAreaForBookingAction`: public, rate-limited by slug (same pattern as slot fetch).
- Manual override: require session + dispatcher+ role; log override in `BookingRequest.internalNotes` or new audit field `"Service area override by {user}"`.

---

## Validation

### Unit tests (`tests/unit/service-area-enforcement.test.ts`)

- normalizeUsZip variants
- zip_list match / no match
- haversine known distance (Austin HQ → Round Rock ~15mi)
- mode off always passes

### Smoke (`npm run smoke:service-area-enforcement`)

1. Set smoke org to `zip_list` with `78701`, `78702`
2. Public book with `78701` → success
3. Public book with `73301` → rejected with message
4. Switch to `radius` 10mi with HQ coords → near pass, far fail
5. Manual book outside with override → success + note
6. Reset org to `off`

### Regression

- `npm run smoke:business-profile`
- `npm run smoke:manual-booking`
- `npm run smoke:public-booking-parity`
- `npm run build`

---

## Risks

| Risk | Mitigation |
|------|------------|
| Geocoding API cost / quota | ZIP-first messaging in UI; geocode only on submit; env-gated |
| False negatives (border addresses) | Document radius buffer; owner override on manual |
| Places doesn't return geometry | Server geocode on profile save; block radius until coords exist |
| UX friction late in funnel | 45.1: move address earlier or ZIP-only pre-check on step 1 |
| ADR scope creep | Enforcement is post-MVP P2 — update ADR addendum, not core MVP doc |

---

## Open questions for product owner

1. **Hard block vs waitlist** — Should out-of-area customers submit a “notify me” lead? (Recommend: block only in v1.)
2. **Radius default** — 15, 25, or 30 miles preset?
3. **Onboarding** — Offer enforcement setup in wizard step 3, or settings-only? (Recommend: settings-only v1.)
4. **Display when enforced** — Append “Serving ZIP codes …” on booking page, or keep marketing label only?
5. **Server geocode** — OK to add `GOOGLE_MAPS_SERVER_API_KEY` (separate from public Places key)?

---

## Effort estimate

| Area | T-shirt |
|------|---------|
| Schema + lib + tests | S |
| Settings UI | S |
| Booking integration + public UX | M |
| Geocoding + HQ coords | M |
| Smoke + docs | S |
| **Total** | **~1 sprint (M)** |

---

## Related backlog (separate planning sessions)

| Item | Sprint file | Notes |
|------|-------------|-------|
| Multi-location | `tasks/sprint-46-multi-location.md` | **Conflicts with org-scoped radius** until location entity exists |
| Provider Open Jobs self-claim | `tasks/sprint-47-provider-open-jobs.md` | Crew/scheduling |
| Providers Activity kanban | `tasks/sprint-48-providers-activity-kanban.md` | Ops board |
| Promo codes / gift cards | `tasks/sprint-49-promo-codes-portal-rebook.md` | Payments scope |

**Next planning session:** Multi-location deep dive — `tasks/sprint-46-multi-location.md` (after PO locks sprint 45 open questions).
