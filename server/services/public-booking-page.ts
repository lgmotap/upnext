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
import { loadPublicPayAtBookingContext } from "@/server/services/pay-at-booking";
import { listPricingParametersForServices } from "@/server/repositories/pricing-parameters";
import { listFrequencyDiscountsForServices, toFrequencyDiscountConfigs } from "@/server/repositories/frequency-discounts";
import { listActiveBookingFormFields } from "@/server/repositories/booking-form-fields";
import { ensureIndustryCatalogForOrg } from "@/server/services/industry-catalog";
import type { PricingParameterConfig } from "@/lib/pricing/parameters";
import type { BookingFormField } from "@/generated/prisma/client";
import type { FrequencyDiscountConfig } from "@/lib/pricing/frequency-discount";

function formatTime12h(hm: string): string {
  const [h, m] = hm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function mapService(
  s: {
    id: string;
    name: string;
    description: string | null;
    durationMinutes: number;
    basePriceCents: number;
    currency: string;
    isAddon: boolean;
    iconKey: string | null;
  },
  pricingParameters: PricingParameterConfig[],
  frequencyDiscounts: FrequencyDiscountConfig[],
) {
  return {
    id: s.id,
    name: s.name,
    description: s.description,
    durationMinutes: s.durationMinutes,
    basePriceCents: s.basePriceCents,
    currency: s.currency,
    isAddon: s.isAddon,
    iconKey: s.iconKey,
    pricingParameters,
    frequencyDiscounts,
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
        websiteUrl: string | null;
        logoUrl: string | null;
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
      payAtBooking: {
        showPaymentStep: boolean;
        requirePaymentAtBooking: boolean;
      };
      customFormFields: BookingFormField[];
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
  if (value === "payment_cancelled") return "Payment was cancelled. Your booking was not completed.";
  return decodeURIComponent(value);
}

export async function loadPublicBookingPage(
  businessSlug: string,
  searchParams: Record<string, string | string[] | undefined>,
  options: { embedded?: boolean } = {},
): Promise<PublicBookingPageResult> {
  const profile = await getBusinessProfileBySlug(businessSlug);
  if (!profile || !profile.bookingEnabled) return { kind: "not_found" };

  let primaryServices = await listPublicPrimaryServicesForOrg(profile.organizationId);
  let addonServices = await listPublicAddonServicesForOrg(profile.organizationId);

  if (primaryServices.length === 0) {
    await ensureIndustryCatalogForOrg(profile.organizationId);
    primaryServices = await listPublicPrimaryServicesForOrg(profile.organizationId);
    addonServices = await listPublicAddonServicesForOrg(profile.organizationId);
  }

  const [primaryServicesFinal, addonServicesFinal] = [primaryServices, addonServices];

  const allIds = [...primaryServicesFinal, ...addonServicesFinal].map((s) => s.id);
  const paramRows = await listPricingParametersForServices(allIds);
  const discountRows = await listFrequencyDiscountsForServices(allIds);
  const paramsByService = new Map<string, PricingParameterConfig[]>();
  const discountsByService = new Map<string, FrequencyDiscountConfig[]>();
  for (const row of paramRows) {
    const list = paramsByService.get(row.serviceId) ?? [];
    list.push({
      parameterType: row.parameterType,
      unitPriceCents: row.unitPriceCents,
      includedUnits: row.includedUnits,
      maxUnits: row.maxUnits,
    });
    paramsByService.set(row.serviceId, list);
  }
  for (const row of discountRows) {
    const list = discountsByService.get(row.serviceId) ?? [];
    list.push({
      frequency: row.frequency,
      percentOff: row.percentOff,
      amountOffCents: row.amountOffCents,
    });
    discountsByService.set(row.serviceId, list);
  }

  if (primaryServicesFinal.length === 0) {
    return { kind: "empty", businessName: profile.displayName };
  }

  const serviceIdParam =
    typeof searchParams.serviceId === "string" ? searchParams.serviceId : undefined;
  const initialService =
    serviceIdParam && primaryServicesFinal.some((s) => s.id === serviceIdParam)
      ? primaryServicesFinal.find((s) => s.id === serviceIdParam)!
      : primaryServicesFinal[0];

  const daysResult = await getPublicAvailableDays(businessSlug, initialService.id, []);
  const days = daysResult?.days ?? [];
  const firstDate = days[0]?.date ?? "";
  const rawSlots = firstDate
    ? ((await getPublicSlotsForDay(businessSlug, initialService.id, firstDate, [])) ?? [])
    : [];

  const prefill = await resolvePrefill(profile.organizationId, searchParams);
  const embedded = options.embedded ?? searchParams.embed === "1";
  const payAtBooking = await loadPublicPayAtBookingContext(businessSlug);
  const customFormFields = await listActiveBookingFormFields(profile.organizationId);

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
      websiteUrl: profile.websiteUrl,
      logoUrl: profile.logoUrl,
      customerPortalEnabled: isCustomerPortalEnabled(profile),
    },
    primaryServices: primaryServicesFinal.map((s) =>
      mapService(s, paramsByService.get(s.id) ?? [], discountsByService.get(s.id) ?? []),
    ),
    addonServices: addonServicesFinal.map((s) =>
      mapService(s, paramsByService.get(s.id) ?? [], discountsByService.get(s.id) ?? []),
    ),
    initialDays: days,
    initialSlots: rawSlots.map((s) => ({
      date: s.date,
      time: s.time,
      label: formatTime12h(s.time),
    })),
    initialServiceId: initialService.id,
    initialDate: firstDate,
    initialTime: rawSlots[0]?.time ?? "",
    prefill,
    error: parseError(searchParams),
    embedded,
    payAtBooking: {
      showPaymentStep: payAtBooking.showPaymentStep,
      requirePaymentAtBooking: payAtBooking.requirePaymentAtBooking,
    },
    customFormFields,
  };
}
