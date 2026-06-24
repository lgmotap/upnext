import { prisma } from "@/lib/db/prisma";

export function findCustomerByEmail(organizationId: string, email: string) {
  return prisma.customer.findFirst({
    where: { organizationId, email: email.toLowerCase() },
    include: { addresses: { where: { isDefault: true }, take: 1 } },
  });
}

export function createCustomerWithAddress(
  organizationId: string,
  data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    line1: string;
    line2?: string | null;
    city: string;
    region: string;
    postalCode: string;
    customerNotes?: string | null;
  },
) {
  return prisma.customer.create({
    data: {
      organizationId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      phone: data.phone || null,
      notes: data.customerNotes || null,
      addresses: {
        create: {
          line1: data.line1,
          line2: data.line2 || null,
          city: data.city,
          region: data.region,
          postalCode: data.postalCode,
          isDefault: true,
        },
      },
    },
    include: { addresses: true },
  });
}

export function updateCustomerContact(
  customerId: string,
  organizationId: string,
  data: { firstName: string; lastName: string; phone?: string | null },
) {
  return prisma.customer.updateMany({
    where: { id: customerId, organizationId },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || null,
    },
  });
}

export function listCustomersForOrg(organizationId: string) {
  return prisma.customer.findMany({
    where: { organizationId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { jobs: true } },
      addresses: { where: { isDefault: true }, take: 1 },
    },
  });
}

export function getCustomerForOrg(organizationId: string, customerId: string) {
  return prisma.customer.findFirst({
    where: { id: customerId, organizationId },
    include: {
      addresses: { orderBy: { isDefault: "desc" } },
      _count: { select: { jobs: true } },
    },
  });
}

export async function getCustomerLifetimeCents(organizationId: string, customerId: string) {
  const agg = await prisma.job.aggregate({
    where: {
      organizationId,
      customerId,
      status: { in: ["completed", "confirmed", "in_progress", "scheduled"] },
    },
    _sum: { priceCents: true },
  });
  return agg._sum.priceCents ?? 0;
}
