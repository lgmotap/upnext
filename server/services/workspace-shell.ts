import { prisma } from "@/lib/db/prisma";
import { formatDisplayDateTime } from "@/lib/datetime/timezone";
import { formatRelativeTime } from "@/lib/datetime/relative";
import { userInitials } from "@/lib/user/avatar";
import type { AppSession } from "@/server/permissions/session";

export type ShellNotificationItem = {
  id: string;
  href: string;
  title: string;
  subtitle: string;
  highlight?: boolean;
};

export type WorkspaceShellData = {
  businessName: string;
  serviceArea: string;
  publicSlug: string;
  ownerInitials: string;
  userName: string;
  userEmail: string;
  userAvatarUrl: string | null;
  role: AppSession["role"];
  pendingBookings: number;
  canManageTeam: boolean;
  canManageBilling: boolean;
  notifications: ShellNotificationItem[];
};

async function getShellNotifications(
  organizationId: string,
  timeZone: string,
): Promise<ShellNotificationItem[]> {
  const now = new Date();
  const [pending, recentJobs] = await Promise.all([
    prisma.bookingRequest.findMany({
      where: { organizationId, status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { customer: true, service: true },
    }),
    prisma.job.findMany({
      where: { organizationId, status: { in: ["completed", "in_progress"] } },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { customer: true, service: true },
    }),
  ]);

  const items: ShellNotificationItem[] = [];

  for (const b of pending) {
    const name = `${b.customer.firstName} ${b.customer.lastName}`.trim();
    items.push({
      id: `booking-${b.id}`,
      href: `/app/bookings/${b.id}`,
      title: `New request from ${name}`,
      subtitle: `${b.service.name} · ${formatDisplayDateTime(b.requestedStartAt, timeZone)}`,
      highlight: true,
    });
  }

  for (const job of recentJobs) {
    const name = `${job.customer.firstName} ${job.customer.lastName}`.trim();
    const verb = job.status === "completed" ? "Completed" : "In progress";
    items.push({
      id: `job-${job.id}`,
      href: `/app/jobs/${job.id}`,
      title: `${verb}: ${name}`,
      subtitle: `${job.service.name} · ${formatRelativeTime(job.updatedAt, now)}`,
    });
  }

  return items.slice(0, 8);
}

export async function getWorkspaceShellData(
  organizationId: string,
  session: Pick<AppSession, "name" | "email" | "role" | "avatarUrl">,
  options: { canManageTeam: boolean; canManageBilling: boolean },
): Promise<WorkspaceShellData | null> {
  const userName = session.name ?? session.email.split("@")[0] ?? "User";

  const setup = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      name: true,
      timezone: true,
      businessProfile: {
        select: {
          displayName: true,
          serviceArea: true,
          publicSlug: true,
        },
      },
    },
  });

  if (!setup?.businessProfile) return null;

  const timeZone = setup.timezone ?? "America/New_York";
  const [pendingBookings, notifications] = await Promise.all([
    prisma.bookingRequest.count({
      where: { organizationId, status: "pending" },
    }),
    getShellNotifications(organizationId, timeZone),
  ]);

  const initials = userInitials(session.name, session.email);

  return {
    businessName: setup.businessProfile.displayName || setup.name,
    serviceArea: setup.businessProfile.serviceArea ?? "Service area not set",
    publicSlug: setup.businessProfile.publicSlug,
    ownerInitials: initials,
    userName,
    userEmail: session.email,
    userAvatarUrl: session.avatarUrl,
    role: session.role,
    pendingBookings,
    canManageTeam: options.canManageTeam,
    canManageBilling: options.canManageBilling,
    notifications,
  };
}
