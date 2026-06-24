export type PublicBookingPrefillFields = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  customerNotes?: string;
};

function pick(params: Record<string, string | string[] | undefined>, key: string, max: number): string | undefined {
  const raw = params[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value?.trim()) return undefined;
  return value.trim().slice(0, max);
}

/** Parse unsigned query prefill — display only; never used for pricing or auth. */
export function parsePublicPrefillFromSearchParams(
  params: Record<string, string | string[] | undefined>,
): PublicBookingPrefillFields | undefined {
  const firstName = pick(params, "firstName", 80);
  const lastName = pick(params, "lastName", 80);
  const email = pick(params, "email", 200)?.toLowerCase();
  if (!firstName && !lastName && !email) return undefined;

  const emailOk = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return {
    firstName: firstName ?? "",
    lastName: lastName ?? "",
    email: emailOk ? (email ?? "") : "",
    phone: pick(params, "phone", 30),
    line1: pick(params, "line1", 200),
    line2: pick(params, "line2", 200),
    city: pick(params, "city", 100),
    region: pick(params, "region", 100),
    postalCode: pick(params, "postalCode", 20),
    customerNotes: pick(params, "customerNotes", 500),
  };
}

export function mergePrefill(
  signed?: PublicBookingPrefillFields,
  query?: PublicBookingPrefillFields,
): PublicBookingPrefillFields | undefined {
  if (!signed && !query) return undefined;
  return {
    firstName: signed?.firstName || query?.firstName || "",
    lastName: signed?.lastName || query?.lastName || "",
    email: signed?.email || query?.email || "",
    phone: signed?.phone || query?.phone,
    line1: signed?.line1 || query?.line1,
    line2: signed?.line2 || query?.line2,
    city: signed?.city || query?.city,
    region: signed?.region || query?.region,
    postalCode: signed?.postalCode || query?.postalCode,
    customerNotes: signed?.customerNotes || query?.customerNotes,
  };
}
