import { prisma } from "@/lib/db/prisma";

export function assignJobToMember(jobId: string, membershipId: string, organizationId: string) {
  return prisma.$transaction(async (tx) => {
    const job = await tx.job.findFirst({ where: { id: jobId, organizationId } });
    if (!job) return null;

    const membership = await tx.membership.findFirst({
      where: { id: membershipId, organizationId, status: "active" },
    });
    if (!membership) return null;

    await tx.jobAssignment.deleteMany({ where: { jobId } });

    return tx.jobAssignment.create({
      data: { jobId, membershipId, role: "primary" },
      include: {
        membership: { include: { user: true } },
      },
    });
  });
}

export function listJobsAssignedToMember(
  organizationId: string,
  membershipId: string,
  rangeStart: Date,
  rangeEnd: Date,
) {
  return prisma.job.findMany({
    where: {
      organizationId,
      scheduledStartAt: { gte: rangeStart, lt: rangeEnd },
      status: { notIn: ["cancelled", "completed"] },
      assignments: { some: { membershipId } },
    },
    orderBy: { scheduledStartAt: "asc" },
    include: {
      customer: true,
      service: true,
      customerAddress: true,
      assignments: { include: { membership: { include: { user: true } } } },
    },
  });
}

export async function isMemberAssignedToJob(
  organizationId: string,
  membershipId: string,
  jobId: string,
): Promise<boolean> {
  const row = await prisma.jobAssignment.findFirst({
    where: {
      jobId,
      membershipId,
      job: { organizationId },
    },
  });
  return Boolean(row);
}
