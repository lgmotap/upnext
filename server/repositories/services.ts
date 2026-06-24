import { prisma } from "@/lib/db/prisma";

export function listServicesForOrg(organizationId: string) {
  return prisma.service.findMany({
    where: { organizationId },
    orderBy: [{ isAddon: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
}

export function listPublicServicesForOrg(organizationId: string) {
  return prisma.service.findMany({
    where: { organizationId, isActive: true, isPublic: true },
    orderBy: [{ isAddon: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
}

export function listPublicPrimaryServicesForOrg(organizationId: string) {
  return prisma.service.findMany({
    where: { organizationId, isActive: true, isPublic: true, isAddon: false },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export function listPublicAddonServicesForOrg(organizationId: string) {
  return prisma.service.findMany({
    where: { organizationId, isActive: true, isPublic: true, isAddon: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export function listActivePrimaryServicesForOrg(organizationId: string) {
  return prisma.service.findMany({
    where: { organizationId, isActive: true, isAddon: false },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export function listActiveAddonServicesForOrg(organizationId: string) {
  return prisma.service.findMany({
    where: { organizationId, isActive: true, isAddon: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export function getServiceForOrg(organizationId: string, serviceId: string) {
  return prisma.service.findFirst({
    where: { id: serviceId, organizationId },
  });
}

export function getBusinessProfileBySlug(publicSlug: string) {
  return prisma.businessProfile.findUnique({
    where: { publicSlug },
    include: {
      organization: {
        select: { id: true, timezone: true, currency: true, status: true },
      },
    },
  });
}
