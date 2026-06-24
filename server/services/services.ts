import { prisma } from "@/lib/db/prisma";
import type { ServiceInput } from "@/server/validators/service";

export async function createService(organizationId: string, currency: string, input: ServiceInput) {
  const maxSort = await prisma.service.aggregate({
    where: { organizationId },
    _max: { sortOrder: true },
  });

  return prisma.service.create({
    data: {
      organizationId,
      name: input.name,
      description: input.description || null,
      durationMinutes: input.durationMinutes,
      basePriceCents: input.basePriceCents,
      currency,
      isActive: input.isActive ?? true,
      isPublic: input.isPublic ?? true,
      isAddon: input.isAddon ?? false,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });
}

export async function updateService(
  organizationId: string,
  serviceId: string,
  input: Partial<ServiceInput>,
) {
  const existing = await prisma.service.findFirst({ where: { id: serviceId, organizationId } });
  if (!existing) return null;

  return prisma.service.update({
    where: { id: serviceId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description || null }),
      ...(input.durationMinutes !== undefined && { durationMinutes: input.durationMinutes }),
      ...(input.basePriceCents !== undefined && { basePriceCents: input.basePriceCents }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.isPublic !== undefined && { isPublic: input.isPublic }),
      ...(input.isAddon !== undefined && { isAddon: input.isAddon }),
    },
  });
}

export async function toggleServiceActive(organizationId: string, serviceId: string) {
  const existing = await prisma.service.findFirst({ where: { id: serviceId, organizationId } });
  if (!existing) return null;
  return prisma.service.update({
    where: { id: serviceId },
    data: { isActive: !existing.isActive },
  });
}

export async function deleteService(organizationId: string, serviceId: string) {
  const existing = await prisma.service.findFirst({ where: { id: serviceId, organizationId } });
  if (!existing) return false;
  await prisma.service.delete({ where: { id: serviceId } });
  return true;
}
