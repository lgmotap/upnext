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

export async function listExtrasForApi(organizationId: string, since: Date | null, limitRaw: string | null) {
  const limit = clampLimit(limitRaw);
  const rows = await prisma.service.findMany({
    where: {
      organizationId,
      isAddon: true,
      ...(since ? { updatedAt: { gt: since } } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "asc" }, { id: "asc" }],
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
      sortOrder: true,
      iconKey: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const nextSince =
    rows.length === limit ? rows[rows.length - 1]?.updatedAt.toISOString() : null;

  return { data: rows, nextSince };
}

export async function listCategoriesForApi(organizationId: string) {
  const rows = await prisma.service.findMany({
    where: { organizationId, isActive: true },
    orderBy: [{ isAddon: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      isAddon: true,
      sortOrder: true,
      isPublic: true,
    },
  });

  const primary = rows.filter((r) => !r.isAddon);
  const addons = rows.filter((r) => r.isAddon);

  return {
    data: [
      {
        id: "primary",
        name: "Services",
        sortOrder: 0,
        serviceIds: primary.map((s) => s.id),
        services: primary,
      },
      {
        id: "addons",
        name: "Add-ons",
        sortOrder: 1,
        serviceIds: addons.map((s) => s.id),
        services: addons,
      },
    ],
  };
}

const PUBLIC_FREQUENCIES = ["one_time", "weekly", "biweekly", "monthly"] as const;

export async function listFrequenciesForApi(organizationId: string) {
  const services = await prisma.service.findMany({
    where: { organizationId, isActive: true, isAddon: false },
    select: { id: true, name: true },
    orderBy: { sortOrder: "asc" },
  });
  const serviceIds = services.map((s) => s.id);
  const discounts = await prisma.serviceFrequencyDiscount.findMany({
    where: { serviceId: { in: serviceIds } },
    orderBy: [{ serviceId: "asc" }, { frequency: "asc" }],
  });

  const discountsByService = new Map<string, typeof discounts>();
  for (const row of discounts) {
    const list = discountsByService.get(row.serviceId) ?? [];
    list.push(row);
    discountsByService.set(row.serviceId, list);
  }

  return {
    data: PUBLIC_FREQUENCIES.map((frequency) => ({
      frequency,
      label:
        frequency === "one_time"
          ? "One-time"
          : frequency === "weekly"
            ? "Weekly"
            : frequency === "biweekly"
              ? "Every 2 weeks"
              : "Monthly",
      serviceDiscounts: services.map((service) => {
        const match = discountsByService.get(service.id)?.find((d) => d.frequency === frequency);
        return {
          serviceId: service.id,
          serviceName: service.name,
          percentOff: match?.percentOff ?? 0,
          amountOffCents: match?.amountOffCents ?? 0,
        };
      }),
    })),
  };
}

export async function getCompanyForApi(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      timezone: true,
      currency: true,
      businessProfile: {
        select: {
          displayName: true,
          publicSlug: true,
          logoUrl: true,
          phone: true,
          email: true,
          websiteUrl: true,
          serviceArea: true,
          description: true,
          bookingEnabled: true,
        },
      },
    },
  });
  if (!org?.businessProfile) return null;

  const p = org.businessProfile;
  return {
    data: {
      name: p.displayName,
      publicSlug: p.publicSlug,
      timezone: org.timezone,
      currency: org.currency,
      logoUrl: p.logoUrl,
      phone: p.phone,
      email: p.email,
      websiteUrl: p.websiteUrl,
      serviceArea: p.serviceArea,
      description: p.description,
      bookingEnabled: p.bookingEnabled,
    },
  };
}

export async function getBookingSettingsForApi(organizationId: string) {
  const profile = await prisma.businessProfile.findUnique({
    where: { organizationId },
    select: {
      minNoticeHours: true,
      maxBookingDaysAhead: true,
      slotIntervalMinutes: true,
      bufferMinutesBetweenJobs: true,
      providerCarryOverMinutes: true,
      bookingEnabled: true,
      payAtBookingEnabled: true,
      requirePaymentAtBooking: true,
    },
  });
  if (!profile) return null;

  return {
    data: {
      minNoticeHours: profile.minNoticeHours,
      maxBookingDaysAhead: profile.maxBookingDaysAhead,
      slotIntervalMinutes: profile.slotIntervalMinutes,
      bufferMinutesBetweenJobs: profile.bufferMinutesBetweenJobs,
      providerCarryOverMinutes: profile.providerCarryOverMinutes,
      bookingEnabled: profile.bookingEnabled,
      customerCancelNoticeHours: profile.minNoticeHours,
      payAtBookingEnabled: profile.payAtBookingEnabled,
      requirePaymentAtBooking: profile.requirePaymentAtBooking,
    },
  };
}

export async function listCustomFieldsForApi(organizationId: string) {
  const rows = await prisma.bookingFormField.findMany({
    where: { organizationId, active: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      key: true,
      label: true,
      fieldType: true,
      optionsJson: true,
      required: true,
      sortOrder: true,
    },
  });
  return { data: rows };
}
