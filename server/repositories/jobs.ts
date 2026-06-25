import { prisma } from "@/lib/db/prisma";
import type { JobStatus } from "@/generated/prisma/client";
import { DEFAULT_LIST_PAGE_SIZE } from "@/lib/pagination";
import type { Prisma } from "@/generated/prisma/client";

export type ListJobsOptions = {
  status?: JobStatus;
  page?: number;
  pageSize?: number;
  scheduledFrom?: Date;
  scheduledTo?: Date;
  unassignedOnly?: boolean;
};

function jobsWhere(
  organizationId: string,
  options?: Omit<ListJobsOptions, "page" | "pageSize">,
): Prisma.JobWhereInput {
  return {
    organizationId,
    ...(options?.status ? { status: options.status } : {}),
    ...(options?.scheduledFrom && options?.scheduledTo
      ? { scheduledStartAt: { gte: options.scheduledFrom, lt: options.scheduledTo } }
      : {}),
    ...(options?.unassignedOnly ? { assignments: { none: {} } } : {}),
  };
}

export function countJobsForOrg(
  organizationId: string,
  options?: Omit<ListJobsOptions, "page" | "pageSize">,
) {
  return prisma.job.count({
    where: jobsWhere(organizationId, options),
  });
}

export function listJobsForOrg(organizationId: string, options?: ListJobsOptions) {
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = options?.pageSize ?? DEFAULT_LIST_PAGE_SIZE;
  const skip = (page - 1) * pageSize;

  return prisma.job.findMany({
    where: jobsWhere(organizationId, options),
    orderBy: { scheduledStartAt: "desc" },
    skip,
    take: pageSize,
    include: {
      customer: true,
      service: true,
      customerAddress: true,
    },
  });
}

export function listJobsInRange(organizationId: string, rangeStart: Date, rangeEnd: Date) {
  return prisma.job.findMany({
    where: {
      organizationId,
      scheduledStartAt: { gte: rangeStart, lt: rangeEnd },
      status: { notIn: ["cancelled"] },
    },
    orderBy: { scheduledStartAt: "asc" },
    include: {
      customer: true,
      service: true,
      assignments: { take: 1, select: { membershipId: true } },
    },
  });
}

export function getJobForOrg(organizationId: string, jobId: string) {
  return prisma.job.findFirst({
    where: { id: jobId, organizationId },
    include: {
      customer: { include: { addresses: true } },
      service: true,
      customerAddress: true,
      bookingRequest: { include: { addons: { select: { name: true }, orderBy: { createdAt: "asc" } } } },
      assignments: { include: { membership: { include: { user: true } } } },
      paymentRecord: true,
      checklistItems: { orderBy: { sortOrder: "asc" } },
      jobSeries: true,
    },
  });
}

export function listJobsForCustomer(organizationId: string, customerId: string) {
  return prisma.job.findMany({
    where: { organizationId, customerId },
    orderBy: { scheduledStartAt: "desc" },
    include: { service: true },
  });
}
