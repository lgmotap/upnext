import { prisma } from "@/lib/db/prisma";
import { DEFAULT_LIST_PAGE_SIZE } from "@/lib/pagination";

export { DEFAULT_LIST_PAGE_SIZE as CUSTOMERS_PAGE_SIZE };

function customerSearchWhere(organizationId: string, q?: string, tag?: string) {
  const trimmed = q?.trim();
  const tagTrimmed = tag?.trim().toLowerCase();
  return {
    organizationId,
    ...(tagTrimmed ? { tags: { has: tagTrimmed } } : {}),
    ...(trimmed
      ? {
          OR: [
            { firstName: { contains: trimmed, mode: "insensitive" as const } },
            { lastName: { contains: trimmed, mode: "insensitive" as const } },
            { email: { contains: trimmed, mode: "insensitive" as const } },
            { phone: { contains: trimmed, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
}

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

export function countCustomersForOrg(organizationId: string, q?: string, tag?: string) {
  return prisma.customer.count({ where: customerSearchWhere(organizationId, q, tag) });
}

export function listCustomersForOrg(
  organizationId: string,
  options?: {
    q?: string;
    tag?: string;
    sort?: "recent" | "name" | "jobs";
    page?: number;
    pageSize?: number;
  },
) {
  const sort = options?.sort ?? "recent";
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = options?.pageSize ?? DEFAULT_LIST_PAGE_SIZE;
  const skip = (page - 1) * pageSize;

  return prisma.customer.findMany({
    where: customerSearchWhere(organizationId, options?.q, options?.tag),
    orderBy:
      sort === "name"
        ? [{ lastName: "asc" }, { firstName: "asc" }]
        : sort === "jobs"
          ? { jobs: { _count: "desc" } }
          : { updatedAt: "desc" },
    skip,
    take: pageSize,
    include: {
      _count: { select: { jobs: true } },
      addresses: { where: { isDefault: true }, take: 1 },
    },
  });
}

export async function getLifetimeCentsByCustomerIds(organizationId: string, customerIds: string[]) {
  if (customerIds.length === 0) return {} as Record<string, number>;

  const rows = await prisma.job.groupBy({
    by: ["customerId"],
    where: {
      organizationId,
      customerId: { in: customerIds },
      status: { in: ["completed", "confirmed", "in_progress", "scheduled"] },
    },
    _sum: { priceCents: true },
  });

  return Object.fromEntries(rows.map((r) => [r.customerId, r._sum.priceCents ?? 0]));
}

export async function getLastJobAtByCustomerIds(organizationId: string, customerIds: string[]) {
  if (customerIds.length === 0) return {} as Record<string, Date | null>;

  const rows = await prisma.job.groupBy({
    by: ["customerId"],
    where: {
      organizationId,
      customerId: { in: customerIds },
    },
    _max: { scheduledStartAt: true },
  });

  return Object.fromEntries(rows.map((r) => [r.customerId, r._max.scheduledStartAt]));
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

export function addCustomerAddress(
  organizationId: string,
  customerId: string,
  data: {
    line1: string;
    line2?: string | null;
    city: string;
    region: string;
    postalCode: string;
    country: string;
    notes?: string | null;
  },
) {
  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findFirst({
      where: { id: customerId, organizationId },
      select: { id: true },
    });
    if (!customer) return null;

    const hasDefault = await tx.customerAddress.count({
      where: { customerId, isDefault: true },
    });

    return tx.customerAddress.create({
      data: {
        customerId,
        line1: data.line1,
        line2: data.line2 || null,
        city: data.city,
        region: data.region,
        postalCode: data.postalCode,
        country: data.country,
        notes: data.notes || null,
        isDefault: hasDefault === 0,
      },
    });
  });
}

export function updateCustomerNotes(organizationId: string, customerId: string, notes: string) {
  return prisma.customer.updateMany({
    where: { id: customerId, organizationId },
    data: { notes: notes || null },
  });
}

export function updateCustomerTags(organizationId: string, customerId: string, tags: string[]) {
  return prisma.customer.updateMany({
    where: { id: customerId, organizationId },
    data: { tags },
  });
}

export async function listCustomerTagsForOrg(organizationId: string): Promise<string[]> {
  const rows = await prisma.customer.findMany({
    where: { organizationId, tags: { isEmpty: false } },
    select: { tags: true },
  });
  const set = new Set<string>();
  for (const row of rows) {
    for (const tag of row.tags) set.add(tag);
  }
  return [...set].sort();
}
