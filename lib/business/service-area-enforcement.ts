export const SERVICE_AREA_ENFORCEMENT_MODES = ["off", "zip_list", "radius"] as const;
export type ServiceAreaEnforcementMode = (typeof SERVICE_AREA_ENFORCEMENT_MODES)[number];

export const SERVICE_AREA_ENFORCEMENT_LABELS: Record<ServiceAreaEnforcementMode, string> = {
  off: "Off — display label only",
  zip_list: "ZIP codes I serve",
  radius: "Radius from business address",
};

export type ServiceAreaEnforcementConfig = {
  mode: ServiceAreaEnforcementMode;
  zipCodes?: string[];
  radiusMiles?: number;
  originLat?: number | null;
  originLng?: number | null;
};

export type ServiceAreaCustomerPoint = {
  postalCode: string;
  latitude?: number | null;
  longitude?: number | null;
};

export type ServiceAreaCheckFailureReason =
  | "zip_not_listed"
  | "outside_radius"
  | "missing_origin"
  | "missing_customer_location";

export type ServiceAreaCheckResult =
  | { ok: true }
  | { ok: false; reason: ServiceAreaCheckFailureReason };

/** Normalize US ZIP to 5-digit string, or null if invalid. */
export function normalizeUsZip(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{5})(?:-\d{4})?$/);
  return match?.[1] ?? null;
}

/** Parse textarea / comma-separated ZIP input into unique normalized codes. */
export function parseZipCodesInput(raw: string): string[] {
  const parts = raw.split(/[\n,\s]+/).map((p) => p.trim()).filter(Boolean);
  const normalized = parts.map(normalizeUsZip).filter((z): z is string => Boolean(z));
  return [...new Set(normalized)];
}

export function haversineMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 3958.7613 * c;
}

export function checkServiceArea(
  config: ServiceAreaEnforcementConfig,
  customer: ServiceAreaCustomerPoint,
): ServiceAreaCheckResult {
  if (config.mode === "off") return { ok: true };

  if (config.mode === "zip_list") {
    const zip = normalizeUsZip(customer.postalCode);
    if (!zip) return { ok: false, reason: "zip_not_listed" };
    const allowed = config.zipCodes ?? [];
    if (allowed.length === 0) return { ok: true };
    return allowed.includes(zip) ? { ok: true } : { ok: false, reason: "zip_not_listed" };
  }

  const originLat = config.originLat;
  const originLng = config.originLng;
  const radiusMiles = config.radiusMiles;
  if (originLat == null || originLng == null || !radiusMiles || radiusMiles <= 0) {
    return { ok: false, reason: "missing_origin" };
  }

  const lat = customer.latitude;
  const lng = customer.longitude;
  if (lat == null || lng == null) {
    return { ok: false, reason: "missing_customer_location" };
  }

  const distance = haversineMiles(originLat, originLng, lat, lng);
  return distance <= radiusMiles ? { ok: true } : { ok: false, reason: "outside_radius" };
}

export function serviceAreaRejectionMessage(options: {
  serviceAreaLabel: string | null | undefined;
  phone: string | null | undefined;
  postalCode: string;
  reason?: ServiceAreaCheckFailureReason;
}): string {
  const area = options.serviceAreaLabel?.trim() || "our service area";
  const zip = normalizeUsZip(options.postalCode) ?? options.postalCode.trim();
  const phonePart = options.phone?.trim() ? ` Call us at ${options.phone.trim()}.` : "";
  if (options.reason === "missing_customer_location") {
    return `We couldn't verify your address is in ${area}. Please check your street address and ZIP.${phonePart}`;
  }
  if (options.reason === "missing_origin") {
    return `Online booking is temporarily unavailable for location checks. Please call us to book.${phonePart}`;
  }
  return `Sorry, we don't serve ${zip} yet. We currently serve ${area}.${phonePart}`;
}

export function zipCodesFromJson(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(String).map(normalizeUsZip).filter((z): z is string => Boolean(z)))];
}

export function configFromProfile(profile: {
  serviceAreaEnforcementMode: ServiceAreaEnforcementMode;
  serviceAreaRadiusMiles: number | null;
  serviceAreaZipCodesJson: unknown;
  addressLatitude: number | null;
  addressLongitude: number | null;
}): ServiceAreaEnforcementConfig {
  return {
    mode: profile.serviceAreaEnforcementMode,
    zipCodes: zipCodesFromJson(profile.serviceAreaZipCodesJson),
    radiusMiles: profile.serviceAreaRadiusMiles ?? undefined,
    originLat: profile.addressLatitude,
    originLng: profile.addressLongitude,
  };
}
