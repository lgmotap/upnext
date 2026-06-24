import {
  getBusinessProfileBySlug,
  listPublicAddonServicesForOrg,
  listPublicPrimaryServicesForOrg,
} from "@/server/repositories/services";
import { getPublicAvailableDays, getPublicSlotsForDay } from "@/server/services/bookings";
import { getCustomerPortalProfile } from "@/server/repositories/customer-portal";
import { verifyBookingPrefillToken } from "@/lib/portal/prefill-token";
import type { BookableDay } from "@/lib/availability/calendar-ui";
import {
  mergePrefill,
  parsePublicPrefillFromSearchParams,
  type PublicBookingPrefillFields,
} from "@/lib/booking/public-prefill";
import { isCustomerPortalEnabled } from "@/lib/portal/enabled";

function formatTime12h(hm: string): string {
  const [h, m] = hm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function mapService(s: {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  basePriceCents: number;
  currency: string;
  isAddon: boolean;
}) {
  return {
    id: s.id,
    name: s.name,
    description: s.description,
    durationMinutes: s.durationMinutes,
    basePriceCents: s.basePriceCents,
    currency: s.currency,
    isAddon: s.isAddon,
  };
}

export type PublicBookingPageResult =
  | { kind: "not_found" }
  | { kind: "empty"; businessName: string }
  | {
      kind: "ready";
      businessSlug: string;
      timeZone: string;
      business: {
        displayName: string;
        serviceArea: string | null;
        description: string | null;
        phone: string | null;
        email: string | null;
        customerPortalEnabled: boolean;
      };
      primaryServices: ReturnType<typeof mapService>[];
      addonServices: ReturnType<typeof mapService>[];
      initialDays: BookableDay[];
      initialSlots: { date: string; time: string; label: string }[];
      initialServiceId: string;
      initialDate: string;
      initialTime: string;
      prefill?: PublicBookingPrefillFields;
      error?: string;
      embedded: boolean;
    };

async function resolvePrefill(
  organizationId: string,
  searchParams: Record<string, string | string[] | undefined>,
): Promise<PublicBookingPrefillFields | undefined> {
  const queryPrefill = parsePublicPrefillFromSearchParams(searchParams);
  const prefillToken = typeof searchParams.prefill === "string" ? searchParams.prefill : undefined;

  let signed: PublicBookingPrefillFields | undefined;
  if (prefillToken) {
    const payload = verifyBookingPrefillToken(prefillToken);
    if (payload && payload.organizationId === organizationId) {
      const customer = await getCustomerPortalProfile(payload.organizationId, payload.customerId);
      if (customer) {
        const addr = customer.addresses[0];
        signed = {
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone ?? undefined,
          line1: addr?.line1,
          line2: addr?.line2 ?? undefined,
          city: addr?.city,
          region: addr?.region,
          postalCode: addr?.postalCode,
          customerNotes: customer.notes ?? undefined,
        };
      }
    }
  }

  return mergePrefill(signed, queryPrefill);
}

function parseError(searchParams: Record<string, string | string[] | undefined>): string | undefined {
  const raw = searchParams.error;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return undefined;
  if (value === "rate_limit") return "Too many booking attempts. Please try again in an hour.";
  if (value === "invalid") return "Please check your details and try again.";
  return decodeURIComponent(value);
}

export async function loadPublicBookingPage(
  businessSlug: string,
  searchParams: Record<string, string | string[] | undefined>,
  options: { embedded?: boolean } = {},
): Promise<PublicBookingPageResult> {
  const profile = await getBusinessProfileBySlug(businessSlug);
  if (!profile || !profile.bookingEnabled) return { kind: "not_found" };

  const [primaryServices, addonServices] = await Promise.all([
    listPublicPrimaryServicesForOrg(profile.organizationId),
    listPublicAddonServicesForOrg(profile.organizationId),
  ]);

  if (primaryServices.length === 0) {
    return { kind: "empty", businessName: profile.displayName };
  }

  const firstService = primaryServices[0];
  const daysResult = await getPublicAvailableDays(businessSlug, firstService.id, []);
  const days = daysResult?.days ?? [];
  const firstDate = days[0]?.date ?? "";
  const rawSlots = firstDate
    ? ((await getPublicSlotsForDay(businessSlug, firstService.id, firstDate, [])) ?? [])
    : [];

  const prefill = await resolvePrefill(profile.organizationId, searchParams);
  const embedded = options.embedded ?? searchParams.embed === "1";

  return {
    kind: "ready",
    businessSlug,
    timeZone: profile.organization.timezone,
    business: {
      displayName: profile.displayName,
      serviceArea: profile.serviceArea,
      description: profile.description,
      phone: profile.phone,
      email: profile.email,
      customerPortalEnabled: isCustomerPortalEnabled(profile),
    },
    primaryServices: primaryServices.map(mapService),
    addonServices: addonServices.map(mapService),
    initialDays: days,
    initialSlots: rawSlots.map((s) => ({
      date: s.date,
      time: s.time,
      label: formatTime12h(s.time),
    })),
    initialServiceId: firstService.id,
    initialDate: firstDate,
    initialTime: rawSlots[0]?.time ?? "",
    prefill,
    error: parseError(searchParams),
    embedded,
  };
}
