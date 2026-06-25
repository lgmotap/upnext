# Google Maps (Places autocomplete)

Optional browser integration for address autocomplete in onboarding, business settings, and public booking.

## Environment

```bash
# Public — safe for the browser (restrict key by HTTP referrer in Google Cloud Console)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

Add to `.env.local` for local dev. When unset, all address forms fall back to manual street / city / state / ZIP fields (no runtime errors).

## Google Cloud setup

1. Enable **Maps JavaScript API** and **Places API (New)** on your Google Cloud project.
2. Create an API key restricted to:
   - **Application restrictions:** HTTP referrers (`localhost:*`, your production domain).
   - **API restrictions:** Maps JavaScript API + Places API (New) only.
3. Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in Vercel (Production + Preview) when ready.

We use Google's **`PlaceAutocompleteElement`** (not the legacy `google.maps.places.Autocomplete`, which is unavailable for new API keys since March 2025). The script loads with `loading=async` per Google's guidance. **`importLibrary` is not available on the script `load` event** — `load-google-maps.ts` polls until `google.maps.importLibrary` exists before importing Places.

Styling uses Google's supported CSS on `gmp-place-autocomplete` plus `::part(input)` in `app/globals.css`. **Surface ring, radius, height, and font are applied in JS after mount** (`lib/maps/place-autocomplete-styles.ts`) because Google's widget stylesheet loads later and overrides app CSS.

## Code paths

| Path | Component |
|------|-----------|
| `lib/maps/google-maps-config.ts` | `isGoogleMapsConfigured()`, `getGoogleMapsApiKey()` |
| `lib/maps/parse-place-address.ts` | Pure parser for `address_components` (smoke-tested) |
| `components/maps/PlaceAutocompleteLine1.tsx` | Street line widget (`PlaceAutocompleteElement`) |
| `components/maps/AddressAutocompleteFields.tsx` | Full address form + autofill on select |
| `components/maps/load-google-maps.ts` | Lazy-loads Maps JS with `loading=async` + `importLibrary('places')` |

## Where autocomplete is used

| Surface | File |
|---------|------|
| Onboarding step 2 | `app/app/onboarding/OnboardingWizard.tsx` |
| Settings → Business | `components/app/BusinessProfileForm.tsx` |
| Public booking (`/book/[slug]`) | `app/book/[businessSlug]/PublicBookingClient.tsx` |
| Manual booking (`/app/bookings/new`) | `app/app/bookings/new/ManualBookingClient.tsx` |
| Customer profile → Add address | `components/app/CustomerDetailActions.tsx` |

CSV customer import does not use autocomplete (bulk file upload).

## Scope

- US addresses only (`componentRestrictions: { country: "us" }`).
- No server-side Geocoding — key is never used on the server.
- Embed/directions links in crew job views use public Google Maps URLs (`lib/maps/address.ts`) and do not require this key.

## Smoke

```bash
npm run smoke:address-autocomplete
```

Tests the address parser without a key; logs when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is configured.
