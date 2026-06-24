import { prisma } from "@/lib/db/prisma";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function clampLimit(raw: string | null): number {
  const n = raw ? Number.parseInt(raw, 10) : DEFAULT_LIMIT;
  if (!Number.isFinite(n) || n < 1) return DEFAULT_LIMIT;
  return Math.min(n, MAX_LIMIT);
}

export async function listBookingsForApi(
  organizationId: string,
  since: Date | null,
  limitRaw: string | null,
) {
  const limit = clampLimit(limitRaw);
  const rows = await prisma.bookingRequest.findMany({
    where: {
      organizationId,
      ...(since ? { updatedAt: { gt: since } } : {}),
    },
    orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
    take: limit,
    select: {
      id: true,
      status: true,
      frequency: true,
      source: true,
      requestedStartAt: true,
      requestedEndAt: true,
      customerNotes: true,
      createdAt: true,
      updatedAt: true,
      customerId: true,
      serviceId: true,
      customer: { select: { email: true, firstName: true, lastName: true } },
      service: { select: { name: true } },
    },
  });

  const nextSince =
    rows.length === limit ? rows[rows.length - 1]?.updatedAt.toISOString() : null;

  return { data: rows, nextSince };
}

export async function listCustomersForApi(
  organizationId: string,
  since: Date | null,
  limitRaw: string | null,
) {
  const limit = clampLimit(limitRaw);
  const rows = await prisma.customer.findMany({
    where: {
      organizationId,
      ...(since ? { updatedAt: { gt: since } } : {}),
    },
    orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
    take: limit,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      tags: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const nextSince =
    rows.length === limit ? rows[rows.length - 1]?.updatedAt.toISOString() : null;

  return { data: rows, nextSince };
}

export async function listServicesForApi(
  organizationId: string,
  since: Date | null,
  limitRaw: string | null,
) {
  const limit = clampLimit(limitRaw);
  const rows = await prisma.service.findMany({
    where: {
      organizationId,
      ...(since ? { updatedAt: { gt: since } } : {}),
    },
    orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
    take: limit,
    select: {
      id: true,
      name: true,
      description: true,
      durationMinutes: true,
      basePriceCents: true,
      currency: true,
      isActive: true,
      isPublic: true,
      isAddon: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const nextSince =
    rows.length === limit ? rows[rows.length - 1]?.updatedAt.toISOString() : null;

  return { data: rows, nextSince };
}
