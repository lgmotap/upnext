import { prisma } from "@/lib/db/prisma";

export function listTeamMembers(organizationId: string) {
  return prisma.membership.findMany({
    where: { organizationId, status: "active" },
    orderBy: { createdAt: "asc" },
    include: { user: true },
  });
}

export function getAssignableMembers(organizationId: string) {
  return prisma.membership.findMany({
    where: {
      organizationId,
      status: "active",
      role: { in: ["worker", "dispatcher", "admin", "owner"] },
    },
    orderBy: { createdAt: "asc" },
    include: { user: true },
  });
}
