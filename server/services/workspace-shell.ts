import { prisma } from "@/lib/db/prisma";

export type WorkspaceShellData = {
  businessName: string;
  serviceArea: string;
  publicSlug: string;
  ownerInitials: string;
  pendingBookings: number;
  canManageTeam: boolean;
};

export async function getWorkspaceShellData(
  organizationId: string,
  userName: string,
  canManageTeam: boolean,
): Promise<WorkspaceShellData | null> {
  const [setup, pendingBookings] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        name: true,
        businessProfile: {
          select: {
            displayName: true,
            serviceArea: true,
            publicSlug: true,
          },
        },
      },
    }),
    prisma.bookingRequest.count({
      where: { organizationId, status: "pending" },
    }),
  ]);

  if (!setup?.businessProfile) return null;

  const initials = userName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return {
    businessName: setup.businessProfile.displayName || setup.name,
    serviceArea: setup.businessProfile.serviceArea ?? "Service area not set",
    publicSlug: setup.businessProfile.publicSlug,
    ownerInitials: initials || "U",
    pendingBookings,
    canManageTeam,
  };
}
