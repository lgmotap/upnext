import { prisma } from "@/lib/db/prisma";

export function getTeamInviteByToken(token: string) {
  return prisma.teamInvite.findUnique({
    where: { token },
    include: {
      organization: { include: { businessProfile: true } },
      invitedBy: { include: { user: true } },
    },
  });
}

export function listPendingTeamInvites(organizationId: string) {
  return prisma.teamInvite.findMany({
    where: { organizationId, acceptedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    include: {
      invitedBy: { include: { user: true } },
    },
  });
}
