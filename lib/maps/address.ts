type AddressLike = {
  line1: string;
  line2?: string | null;
  city: string;
  region: string;
  postalCode: string;
  country?: string | null;
};

export function formatAddressForMaps(address: AddressLike | null | undefined): string | null {
  if (!address?.line1) return null;
  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.region,
    address.postalCode,
    address.country && address.country !== "US" ? address.country : null,
  ].filter(Boolean);
  return parts.join(", ");
}

/** Google Maps embed — no API key required for basic q= embed. */
export function googleMapsEmbedUrl(query: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

export function googleMapsDirectionsUrl(query: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

export function isSameCalendarDay(
  instant: Date,
  timeZone: string,
  reference = new Date(),
): boolean {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(instant) === fmt.format(reference);
}
