/** Parsed US-oriented address from Google Places `address_components`. */
export type ParsedPlaceAddress = {
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
};

/** Legacy Places (`long_name`) and Places API (New) (`longText`) shapes. */
export type GoogleAddressComponent = {
  long_name?: string;
  short_name?: string;
  longText?: string;
  shortText?: string;
  types: string[];
};

function pick(components: GoogleAddressComponent[], type: string, useShort = false): string {
  const match = components.find((c) => c.types.includes(type));
  if (!match) return "";
  if (useShort) return match.short_name ?? match.shortText ?? "";
  return match.long_name ?? match.longText ?? "";
}

/** Map Google Places address_components to UpNext address fields (US-first). */
export function parseGoogleAddressComponents(
  components: GoogleAddressComponent[],
): ParsedPlaceAddress | null {
  const streetNumber = pick(components, "street_number");
  const route = pick(components, "route");
  const line1 = [streetNumber, route].filter(Boolean).join(" ").trim();
  if (!line1) return null;

  const subpremise = pick(components, "subpremise");
  const city =
    pick(components, "locality") ||
    pick(components, "sublocality") ||
    pick(components, "postal_town") ||
    pick(components, "administrative_area_level_3");
  const region = pick(components, "administrative_area_level_1", true);
  const postalCode = pick(components, "postal_code");
  const country = pick(components, "country", true) || "US";

  if (!city || !region) return null;

  return {
    line1,
    line2: subpremise || undefined,
    city,
    region,
    postalCode,
    country,
  };
}
