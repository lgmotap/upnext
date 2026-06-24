import { prisma } from "@/lib/db/prisma";

export function listChecklistTemplateForService(organizationId: string, serviceId: string) {
  return prisma.checklistTemplate.findMany({
    where: { organizationId, serviceId, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export function listChecklistItemsForJob(organizationId: string, jobId: string) {
  return prisma.jobChecklistItem.findMany({
    where: { job: { id: jobId, organizationId } },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getChecklistItemForJob(
  organizationId: string,
  jobId: string,
  itemId: string,
) {
  return prisma.jobChecklistItem.findFirst({
    where: { id: itemId, jobId, job: { organizationId } },
  });
}
