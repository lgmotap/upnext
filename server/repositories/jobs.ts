import { prisma } from "@/lib/db/prisma";
import type { JobStatus } from "@/generated/prisma/client";

export function listJobsForOrg(organizationId: string, status?: JobStatus) {
  return prisma.job.findMany({
    where: { organizationId, ...(status ? { status } : {}) },
    orderBy: { scheduledStartAt: "desc" },
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
      bookingRequest: true,
      assignments: { include: { membership: { include: { user: true } } } },
      paymentRecord: true,
      checklistItems: { orderBy: { sortOrder: "asc" } },
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
