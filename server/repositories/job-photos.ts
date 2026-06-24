import { prisma } from "@/lib/db/prisma";

export function listJobPhotosForJob(organizationId: string, jobId: string) {
  return prisma.jobPhoto.findMany({
    where: { jobId, job: { organizationId } },
    orderBy: { createdAt: "asc" },
    include: {
      uploadedBy: { include: { user: true } },
    },
  });
}

export function countJobPhotosForJob(organizationId: string, jobId: string) {
  return prisma.jobPhoto.count({
    where: { jobId, job: { organizationId } },
  });
}
