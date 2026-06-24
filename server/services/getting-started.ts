import { prisma } from "@/lib/db/prisma";

export type GettingStartedTask = {
  id: string;
  label: string;
  description: string;
  href: string;
  done: boolean;
  optional?: boolean;
};

export async function getGettingStartedTasks(organizationId: string, bookingUrl: string) {
  const [profile, serviceCount, availabilityCount, memberCount, stripeEnabled] = await Promise.all([
    prisma.businessProfile.findUnique({
      where: { organizationId },
      select: { onboardingCompletedAt: true, phone: true, serviceArea: true },
    }),
    prisma.service.count({ where: { organizationId, isActive: true, isPublic: true } }),
    prisma.availabilityRule.count({ where: { organizationId } }),
    prisma.membership.count({ where: { organizationId, status: "active" } }),
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { stripeConnectChargesEnabled: true },
    }),
  ]);

  const tasks: GettingStartedTask[] = [
    {
      id: "profile",
      label: "Complete business profile",
      description: "Name, phone, and service area for your booking page.",
      href: "/app/settings/business",
      done: Boolean(
        profile?.onboardingCompletedAt && profile.phone && profile.serviceArea,
      ),
    },
    {
      id: "services",
      label: "Add a bookable service",
      description: "At least one active service customers can choose.",
      href: "/app/services?new=1",
      done: serviceCount > 0,
    },
    {
      id: "availability",
      label: "Set your availability",
      description: "Business hours so slots appear on your booking page.",
      href: "/app/settings/availability",
      done: availabilityCount > 0,
    },
    {
      id: "booking-link",
      label: "Share your booking link",
      description: bookingUrl,
      href: bookingUrl,
      done: false,
    },
    {
      id: "team",
      label: "Invite your crew (optional)",
      description: "Add workers who can see assigned jobs in the crew app.",
      href: "/app/team",
      done: memberCount > 1,
      optional: true,
    },
    {
      id: "stripe",
      label: "Connect Stripe for payments (optional)",
      description: "Send payment links after jobs are complete.",
      href: "/app/settings/billing",
      done: Boolean(stripeEnabled?.stripeConnectChargesEnabled),
      optional: true,
    },
  ];

  const required = tasks.filter((t) => !t.optional);
  const completedRequired = required.filter((t) => t.done).length;
  const percent = Math.round((completedRequired / required.length) * 100);

  return { tasks, percent, allRequiredDone: completedRequired === required.length };
}
