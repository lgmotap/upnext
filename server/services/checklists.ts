import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { parseChecklistLines } from "@/server/validators/checklist";

type DbClient = Prisma.TransactionClient | typeof prisma;

export async function replaceChecklistTemplateForService(
  organizationId: string,
  serviceId: string,
  rawLines: string,
) {
  const labels = parseChecklistLines(rawLines);

  const service = await prisma.service.findFirst({ where: { id: serviceId, organizationId } });
  if (!service) return { ok: false as const, error: "Service not found" };

  await prisma.$transaction(async (tx) => {
    await tx.checklistTemplate.deleteMany({ where: { organizationId, serviceId } });
    if (labels.length === 0) return;

    await tx.checklistTemplate.createMany({
      data: labels.map((label, index) => ({
        organizationId,
        serviceId,
        label,
        sortOrder: index,
        isActive: true,
      })),
    });
  });

  return { ok: true as const };
}

export async function seedJobChecklistItems(
  db: DbClient,
  organizationId: string,
  jobId: string,
  serviceId: string,
) {
  const templates = await db.checklistTemplate.findMany({
    where: { organizationId, serviceId, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  if (templates.length === 0) return;

  await db.jobChecklistItem.createMany({
    data: templates.map((template, index) => ({
      jobId,
      label: template.label,
      sortOrder: template.sortOrder ?? index,
    })),
  });
}

/** Backfill checklist items for jobs created before templates existed. */
export async function ensureJobChecklistItems(organizationId: string, jobId: string) {
  const job = await prisma.job.findFirst({ where: { id: jobId, organizationId } });
  if (!job) return null;

  const existing = await prisma.jobChecklistItem.count({ where: { jobId } });
  if (existing > 0) return job;

  await seedJobChecklistItems(prisma, organizationId, jobId, job.serviceId);
  return job;
}

export async function setJobChecklistItemCompleted(
  organizationId: string,
  jobId: string,
  itemId: string,
  membershipId: string,
  completed: boolean,
) {
  const item = await prisma.jobChecklistItem.findFirst({
    where: { id: itemId, jobId, job: { organizationId } },
  });
  if (!item) return { ok: false as const, error: "Checklist item not found" };

  await prisma.jobChecklistItem.update({
    where: { id: itemId },
    data: {
      isCompleted: completed,
      completedByMembershipId: completed ? membershipId : null,
      completedAt: completed ? new Date() : null,
    },
  });

  return { ok: true as const };
}
