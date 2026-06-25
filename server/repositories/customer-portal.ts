import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

export function findCustomerByEmailForOrg(organizationId: string, email: string) {
  return prisma.customer.findFirst({
    where: {
      organizationId,
      email: { equals: email.trim().toLowerCase(), mode: "insensitive" },
    },
    include: {
      addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] },
    },
  });
}

export function getCustomerPortalProfile(organizationId: string, customerId: string) {
  return prisma.customer.findFirst({
    where: { id: customerId, organizationId },
    include: {
      addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] },
    },
  });
}

export function listCustomerPortalBookings(organizationId: string, customerId: string) {
  return prisma.bookingRequest.findMany({
    where: { organizationId, customerId },
    orderBy: { requestedStartAt: "desc" },
    include: {
      service: { select: { name: true } },
      addons: { select: { name: true } },
      job: {
        select: {
          id: true,
          status: true,
          customerAddress: {
            select: { line1: true, city: true, region: true, postalCode: true },
          },
        },
      },
      customer: {
        include: {
          addresses: { where: { isDefault: true }, take: 1 },
        },
      },
    },
  });
}

export function listCustomerOutstandingPayments(organizationId: string, customerId: string) {
  return prisma.paymentRecord.findMany({
    where: {
      organizationId,
      customerId,
      jobId: { not: null },
      status: { in: ["pending", "overdue", "not_requested"] },
    },
    orderBy: { createdAt: "desc" },
    include: {
      job: { select: { id: true, title: true, scheduledStartAt: true, status: true } },
    },
  });
}

export function createCustomerPortalToken(data: {
  organizationId: string;
  customerId: string;
  token: string;
  expiresAt: Date;
}) {
  return prisma.customerPortalToken.create({ data });
}

export function getCustomerPortalToken(token: string) {
  return prisma.customerPortalToken.findUnique({
    where: { token },
    include: {
      customer: true,
      organization: { include: { businessProfile: true } },
    },
  });
}

export function markCustomerPortalTokenUsed(id: string) {
  return prisma.customerPortalToken.update({
    where: { id },
    data: { usedAt: new Date() },
  });
}

export async function purgeExpiredPortalTokens() {
  await prisma.customerPortalToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}

export function updateCustomerPortalLastLogin(customerId: string, organizationId: string) {
  return prisma.customer.updateMany({
    where: { id: customerId, organizationId },
    data: { portalLastLoginAt: new Date() },
  });
}

export function updateCustomerPortalEnabled(organizationId: string, enabled: boolean) {
  return prisma.businessProfile.update({
    where: { organizationId },
    data: { customerPortalEnabled: enabled },
  });
}

export function updatePortalSettings(
  organizationId: string,
  data: {
    customerPortalEnabled: boolean;
    portalPasswordLoginEnabled?: boolean;
    portalFaqJson?: Prisma.InputJsonValue;
  },
) {
  return prisma.businessProfile.update({
    where: { organizationId },
    data: {
      customerPortalEnabled: data.customerPortalEnabled,
      ...(data.portalPasswordLoginEnabled !== undefined
        ? { portalPasswordLoginEnabled: data.portalPasswordLoginEnabled }
        : {}),
      ...(data.portalFaqJson !== undefined ? { portalFaqJson: data.portalFaqJson } : {}),
    },
  });
}
