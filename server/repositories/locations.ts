import { prisma } from "@/lib/db/prisma";

export function listLocationsForOrg(organizationId: string, options?: { activeOnly?: boolean }) {
  return prisma.location.findMany({
    where: {
      organizationId,
      ...(options?.activeOnly ? { isActive: true } : {}),
    },
    orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
}

export function listActiveLocationsForOrg(organizationId: string) {
  return listLocationsForOrg(organizationId, { activeOnly: true });
}

export function getLocationForOrg(organizationId: string, locationId: string) {
  return prisma.location.findFirst({
    where: { id: locationId, organizationId },
  });
}

export function getDefaultLocationForOrg(organizationId: string) {
  return prisma.location.findFirst({
    where: { organizationId, isDefault: true, isActive: true },
    orderBy: { createdAt: "asc" },
  });
}

export function countActiveLocationsForOrg(organizationId: string) {
  return prisma.location.count({
    where: { organizationId, isActive: true },
  });
}

export async function createLocationForOrg(
  organizationId: string,
  data: {
    name: string;
    isDefault?: boolean;
    isActive?: boolean;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    region?: string | null;
    postalCode?: string | null;
    country?: string;
    phone?: string | null;
    timezone?: string | null;
    sortOrder?: number;
  },
) {
  return prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.location.updateMany({
        where: { organizationId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return tx.location.create({
      data: {
        organizationId,
        name: data.name.trim(),
        isDefault: data.isDefault ?? false,
        isActive: data.isActive ?? true,
        addressLine1: data.addressLine1?.trim() || null,
        addressLine2: data.addressLine2?.trim() || null,
        city: data.city?.trim() || null,
        region: data.region?.trim() || null,
        postalCode: data.postalCode?.trim() || null,
        country: data.country ?? "US",
        phone: data.phone?.trim() || null,
        timezone: data.timezone?.trim() || null,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  });
}

export async function updateLocationForOrg(
  organizationId: string,
  locationId: string,
  data: {
    name?: string;
    isDefault?: boolean;
    isActive?: boolean;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    region?: string | null;
    postalCode?: string | null;
    country?: string;
    phone?: string | null;
    timezone?: string | null;
    sortOrder?: number;
  },
) {
  const existing = await getLocationForOrg(organizationId, locationId);
  if (!existing) return null;

  return prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.location.updateMany({
        where: { organizationId, isDefault: true, id: { not: locationId } },
        data: { isDefault: false },
      });
    }

    const activeCount = await tx.location.count({
      where: { organizationId, isActive: true, id: { not: locationId } },
    });
    if (data.isActive === false && existing.isDefault && activeCount === 0) {
      throw new Error("Cannot deactivate the only active location");
    }

    return tx.location.update({
      where: { id: locationId },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.isDefault !== undefined ? { isDefault: data.isDefault } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.addressLine1 !== undefined ? { addressLine1: data.addressLine1?.trim() || null } : {}),
        ...(data.addressLine2 !== undefined ? { addressLine2: data.addressLine2?.trim() || null } : {}),
        ...(data.city !== undefined ? { city: data.city?.trim() || null } : {}),
        ...(data.region !== undefined ? { region: data.region?.trim() || null } : {}),
        ...(data.postalCode !== undefined ? { postalCode: data.postalCode?.trim() || null } : {}),
        ...(data.country !== undefined ? { country: data.country } : {}),
        ...(data.phone !== undefined ? { phone: data.phone?.trim() || null } : {}),
        ...(data.timezone !== undefined ? { timezone: data.timezone?.trim() || null } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      },
    });
  });
}
