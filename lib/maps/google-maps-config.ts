/** Browser-safe Google Maps API key (Places autocomplete). Optional — manual address fallback when unset. */
export function getGoogleMapsApiKey(): string | undefined {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  if (!key || key.length < 10) return undefined;
  return key;
}

export function isGoogleMapsConfigured(): boolean {
  return Boolean(getGoogleMapsApiKey());
}
