/** Server-only US address geocoding via Google Geocoding API (optional). */

type GeocodeParts = {
  line1: string;
  city: string;
  region: string;
  postalCode: string;
};

function mapsGeocodeKey(): string | undefined {
  return (
    process.env.GOOGLE_MAPS_SERVER_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
    undefined
  );
}

export async function geocodeUsAddress(
  parts: GeocodeParts,
): Promise<{ latitude: number; longitude: number } | null> {
  const key = mapsGeocodeKey();
  if (!key) return null;

  const address = [parts.line1, parts.city, parts.region, parts.postalCode, "USA"]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", address);
  url.searchParams.set("key", key);
  url.searchParams.set("components", `country:US|postal_code:${parts.postalCode.trim()}`);

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 0 } });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      status?: string;
      results?: Array<{ geometry?: { location?: { lat?: number; lng?: number } } }>;
    };
    if (data.status !== "OK" || !data.results?.length) return null;
    const loc = data.results[0]?.geometry?.location;
    if (typeof loc?.lat !== "number" || typeof loc?.lng !== "number") return null;
    return { latitude: loc.lat, longitude: loc.lng };
  } catch {
    return null;
  }
}
