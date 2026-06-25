import { prisma } from "@/lib/db/prisma";
import { normalizeBookingHost } from "@/lib/booking/custom-host";

export function findPublicSlugByVerifiedCustomBookingHost(host: string) {
  const normalized = normalizeBookingHost(host);
  if (!normalized) return Promise.resolve(null);

  return prisma.businessProfile.findFirst({
    where: {
      customBookingHost: normalized,
      customBookingVerifiedAt: { not: null },
      bookingEnabled: true,
    },
    select: { publicSlug: true },
  });
}

export function getCustomBookingHostForOrg(organizationId: string) {
  return prisma.businessProfile.findUnique({
    where: { organizationId },
    select: {
      publicSlug: true,
      customBookingHost: true,
      customBookingVerifiedAt: true,
    },
  });
}

export async function updateCustomBookingHost(organizationId: string, host: string | null) {
  const normalized = host ? normalizeBookingHost(host) : null;

  if (normalized) {
    const taken = await prisma.businessProfile.findFirst({
      where: {
        customBookingHost: normalized,
        NOT: { organizationId },
      },
      select: { id: true },
    });
    if (taken) {
      return { ok: false as const, error: "That domain is already used by another business" };
    }
  }

  await prisma.businessProfile.update({
    where: { organizationId },
    data: {
      customBookingHost: normalized,
      customBookingVerifiedAt: null,
    },
  });

  return { ok: true as const };
}

export function markCustomBookingHostVerified(organizationId: string) {
  return prisma.businessProfile.update({
    where: { organizationId },
    data: { customBookingVerifiedAt: new Date() },
  });
}
