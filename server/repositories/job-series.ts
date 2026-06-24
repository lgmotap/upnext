import { prisma } from "@/lib/db/prisma";
import type { JobSeriesStatus } from "@/generated/prisma/client";

export function getJobSeriesForOrg(organizationId: string, seriesId: string) {
  return prisma.jobSeries.findFirst({
    where: { id: seriesId, organizationId },
    include: {
      service: { select: { name: true } },
      customer: { select: { firstName: true, lastName: true, email: true } },
      anchorJob: { select: { id: true, title: true } },
    },
  });
}

export function getJobSeriesByAnchorJob(organizationId: string, anchorJobId: string) {
  return prisma.jobSeries.findFirst({
    where: { organizationId, anchorJobId },
  });
}

export function listDueJobSeries(before: Date, limit = 50) {
  return prisma.jobSeries.findMany({
    where: {
      status: "active",
      nextOccurrenceAt: { lte: before },
    },
    orderBy: { nextOccurrenceAt: "asc" },
    take: limit,
    include: {
      organization: { select: { timezone: true, currency: true } },
      customer: { include: { addresses: { where: { isDefault: true }, take: 1 } } },
      service: true,
    },
  });
}

export async function updateJobSeriesStatus(
  organizationId: string,
  seriesId: string,
  status: JobSeriesStatus,
) {
  return prisma.jobSeries.updateMany({
    where: { id: seriesId, organizationId },
    data: { status },
  });
}
