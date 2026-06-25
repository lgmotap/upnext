import {
  checkServiceArea,
  configFromProfile,
  serviceAreaRejectionMessage,
  type ServiceAreaCustomerPoint,
  type ServiceAreaEnforcementMode,
} from "@/lib/business/service-area-enforcement";
import { geocodeUsAddress } from "@/lib/maps/geocode-address";
import { prisma } from "@/lib/db/prisma";

export type ServiceAreaProfile = {
  serviceArea: string | null;
  phone: string | null;
  serviceAreaEnforcementMode: ServiceAreaEnforcementMode;
  serviceAreaRadiusMiles: number | null;
  serviceAreaZipCodesJson: unknown;
  addressLatitude: number | null;
  addressLongitude: number | null;
};

export async function getServiceAreaProfileByOrganizationId(
  organizationId: string,
): Promise<ServiceAreaProfile | null> {
  return prisma.businessProfile.findUnique({
    where: { organizationId },
    select: {
      serviceArea: true,
      phone: true,
      serviceAreaEnforcementMode: true,
      serviceAreaRadiusMiles: true,
      serviceAreaZipCodesJson: true,
      addressLatitude: true,
      addressLongitude: true,
    },
  });
}

export async function getServiceAreaProfileBySlug(
  businessSlug: string,
): Promise<(ServiceAreaProfile & { organizationId: string }) | null> {
  const profile = await prisma.businessProfile.findFirst({
    where: { publicSlug: businessSlug },
    select: {
      organizationId: true,
      serviceArea: true,
      phone: true,
      serviceAreaEnforcementMode: true,
      serviceAreaRadiusMiles: true,
      serviceAreaZipCodesJson: true,
      addressLatitude: true,
      addressLongitude: true,
    },
  });
  return profile;
}

async function resolveCustomerCoordinates(
  customer: ServiceAreaCustomerPoint & {
    line1?: string;
    city?: string;
    region?: string;
  },
  mode: ServiceAreaEnforcementMode,
): Promise<ServiceAreaCustomerPoint> {
  if (mode !== "radius") return customer;
  if (customer.latitude != null && customer.longitude != null) return customer;
  if (!customer.line1 || !customer.city || !customer.region) return customer;

  const geocoded = await geocodeUsAddress({
    line1: customer.line1,
    city: customer.city,
    region: customer.region,
    postalCode: customer.postalCode,
  });
  if (!geocoded) return customer;
  return { ...customer, latitude: geocoded.latitude, longitude: geocoded.longitude };
}

export async function validateCustomerServiceArea(
  profile: ServiceAreaProfile,
  customer: ServiceAreaCustomerPoint & {
    line1?: string;
    city?: string;
    region?: string;
  },
): Promise<{ ok: true } | { ok: false; error: string; reason: string }> {
  const config = configFromProfile(profile);
  if (config.mode === "off") return { ok: true };

  const resolved = await resolveCustomerCoordinates(customer, config.mode);
  const result = checkServiceArea(config, resolved);
  if (result.ok) return { ok: true };

  return {
    ok: false,
    reason: result.reason,
    error: serviceAreaRejectionMessage({
      serviceAreaLabel: profile.serviceArea,
      phone: profile.phone,
      postalCode: customer.postalCode,
      reason: result.reason,
    }),
  };
}
