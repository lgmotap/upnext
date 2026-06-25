import { prisma } from "@/lib/db/prisma";
import {
  createLocationForOrg,
  getDefaultLocationForOrg,
  getLocationForOrg,
  listActiveLocationsForOrg,
} from "@/server/repositories/locations";

export type PublicLocationOption = {
  id: string;
  name: string;
  label: string;
  isDefault: boolean;
};

export function formatLocationLabel(location: {
  name: string;
  city?: string | null;
  region?: string | null;
}): string {
  const place = [location.city, location.region].filter(Boolean).join(", ");
  return place ? `${location.name} · ${place}` : location.name;
}

export async function ensureDefaultLocationForOrg(organizationId: string) {
  const existing = await getDefaultLocationForOrg(organizationId);
  if (existing) return existing;

  const profile = await prisma.businessProfile.findUnique({
    where: { organizationId },
  });
  if (!profile) return null;

  return createLocationForOrg(organizationId, {
    name: profile.displayName?.trim() || "Main location",
    isDefault: true,
    isActive: true,
    addressLine1: profile.addressLine1,
    addressLine2: profile.addressLine2,
    city: profile.city,
    region: profile.region,
    postalCode: profile.postalCode,
    country: profile.country,
    phone: profile.phone,
  });
}

export async function resolveLocationIdForBooking(
  organizationId: string,
  locationId?: string | null,
): Promise<{ ok: true; locationId: string } | { ok: false; error: string }> {
  if (locationId?.trim()) {
    const loc = await getLocationForOrg(organizationId, locationId.trim());
    if (!loc || !loc.isActive) {
      return { ok: false, error: "Selected location is not available" };
    }
    return { ok: true, locationId: loc.id };
  }

  const defaultLoc = await ensureDefaultLocationForOrg(organizationId);
  if (!defaultLoc) {
    return { ok: false, error: "No service location configured" };
  }
  return { ok: true, locationId: defaultLoc.id };
}

export async function getPublicLocationOptions(
  organizationId: string,
): Promise<PublicLocationOption[]> {
  await ensureDefaultLocationForOrg(organizationId);
  const locations = await listActiveLocationsForOrg(organizationId);
  return locations.map((l) => ({
    id: l.id,
    name: l.name,
    label: formatLocationLabel(l),
    isDefault: l.isDefault,
  }));
}

export async function syncDefaultLocationFromProfile(organizationId: string) {
  const profile = await prisma.businessProfile.findUnique({ where: { organizationId } });
  if (!profile) return;

  const defaultLoc = await getDefaultLocationForOrg(organizationId);
  if (!defaultLoc) {
    await ensureDefaultLocationForOrg(organizationId);
    return;
  }

  await prisma.location.update({
    where: { id: defaultLoc.id },
    data: {
      name: defaultLoc.isDefault ? profile.displayName?.trim() || defaultLoc.name : defaultLoc.name,
      addressLine1: profile.addressLine1,
      addressLine2: profile.addressLine2,
      city: profile.city,
      region: profile.region,
      postalCode: profile.postalCode,
      country: profile.country,
      phone: profile.phone,
    },
  });
}
