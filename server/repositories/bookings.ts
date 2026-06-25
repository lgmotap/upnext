import { prisma } from "@/lib/db/prisma";
import type { BookingFrequency, BookingRequestStatus, PricingParameterType, Prisma } from "@/generated/prisma/client";
import { DEFAULT_LIST_PAGE_SIZE } from "@/lib/pagination";
import { addDaysYmd, formatYmdInTimezone, localDateTimeToUtc } from "@/lib/datetime/timezone";

const bookingRequestListInclude = {
  customer: { include: { addresses: { where: { isDefault: true }, take: 1 } } },
  service: true,
  addons: true,
  parameters: true,
} as const;

export type BookingHistoryStatusFilter =
  | BookingRequestStatus
  | "all"
  | "history";

export type BookingDateRangeFilter = "7d" | "30d" | "today" | "all";

export type ListBookingRequestsOptions = {
  status?: BookingHistoryStatusFilter;
  q?: string;
  range?: BookingDateRangeFilter;
  timeZone?: string;
  page?: number;
  pageSize?: number;
  pendingOnly?: boolean;
};

function buildBookingWhere(
  organizationId: string,
  options: ListBookingRequestsOptions,
): Prisma.BookingRequestWhereInput {
  const where: Prisma.BookingRequestWhereInput = { organizationId };

  if (options.pendingOnly) {
    where.status = "pending";
  } else if (!options.status || options.status === "history") {
    where.status = { not: "pending" };
  } else if (options.status !== "all") {
    where.status = options.status;
  }

  const q = options.q?.trim();
  if (q) {
    where.customer = {
      OR: [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    };
  }

  const range = options.range ?? "all";
  if (range === "7d" || range === "30d") {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - (range === "7d" ? 7 : 30));
    where.createdAt = { gte: since };
  } else if (range === "today" && options.timeZone) {
    const todayYmd = formatYmdInTimezone(new Date(), options.timeZone);
    const start = localDateTimeToUtc(todayYmd, "00:00", options.timeZone);
    const end = localDateTimeToUtc(addDaysYmd(todayYmd, 1), "00:00", options.timeZone);
    where.updatedAt = { gte: start, lt: end };
  }

  return where;
}

export function countBookingRequestsForOrg(
  organizationId: string,
  options: ListBookingRequestsOptions = {},
) {
  return prisma.bookingRequest.count({
    where: buildBookingWhere(organizationId, options),
  });
}

export function listBookingRequestsForOrg(
  organizationId: string,
  options: ListBookingRequestsOptions = {},
) {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? DEFAULT_LIST_PAGE_SIZE;
  return prisma.bookingRequest.findMany({
    where: buildBookingWhere(organizationId, options),
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: bookingRequestListInclude,
  });
}

export function listPendingBookingsInRange(
  organizationId: string,
  rangeStart: Date,
  rangeEnd: Date,
) {
  return prisma.bookingRequest.findMany({
    where: {
      organizationId,
      status: "pending",
      requestedStartAt: { gte: rangeStart, lt: rangeEnd },
    },
    orderBy: { requestedStartAt: "asc" },
    include: {
      customer: { select: { firstName: true, lastName: true } },
      service: { select: { name: true } },
    },
  });
}

export function getBookingRequestForOrg(organizationId: string, bookingRequestId: string) {
  return prisma.bookingRequest.findFirst({
    where: { id: bookingRequestId, organizationId },
    include: {
      customer: {
        include: {
          addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] },
        },
      },
      service: true,
      addons: true,
      parameters: true,
      job: { select: { id: true, status: true, jobSeriesId: true } },
    },
  });
}

export function getPublicBookingRequest(businessSlug: string, bookingRequestId: string) {
  return prisma.bookingRequest.findFirst({
    where: {
      id: bookingRequestId,
      organization: { businessProfile: { publicSlug: businessSlug } },
    },
    include: {
      customer: { include: { addresses: { where: { isDefault: true }, take: 1 } } },
      service: true,
      addons: true,
      organization: { include: { businessProfile: true } },
    },
  });
}

export function createBookingRequest(data: {
  organizationId: string;
  customerId: string;
  serviceId: string;
  requestedStartAt: Date;
  requestedEndAt: Date;
  customerNotes?: string | null;
  internalNotes?: string | null;
  customFieldsJson?: Record<string, string | boolean> | null;
  source?: "public_booking" | "manual" | "recurring";
  frequency?: BookingFrequency;
  parameters?: Array<{ parameterType: PricingParameterType; units: number }>;
  addons?: Array<{
    serviceId: string;
    name: string;
    priceCents: number;
    durationMinutes: number;
  }>;
}) {
  return prisma.bookingRequest.create({
    data: {
      organizationId: data.organizationId,
      customerId: data.customerId,
      serviceId: data.serviceId,
      requestedStartAt: data.requestedStartAt,
      requestedEndAt: data.requestedEndAt,
      customerNotes: data.customerNotes || null,
      internalNotes: data.internalNotes || null,
      customFieldsJson: data.customFieldsJson ?? undefined,
      source: data.source ?? "public_booking",
      frequency: data.frequency ?? "one_time",
      ...(data.parameters?.length
        ? {
            parameters: {
              create: data.parameters.map((p) => ({
                parameterType: p.parameterType,
                units: p.units,
              })),
            },
          }
        : {}),
      ...(data.addons?.length
        ? {
            addons: {
              create: data.addons.map((a) => ({
                serviceId: a.serviceId,
                name: a.name,
                priceCents: a.priceCents,
                durationMinutes: a.durationMinutes,
              })),
            },
          }
        : {}),
    },
  });
}

export function updateBookingRequestStatus(
  organizationId: string,
  bookingRequestId: string,
  status: BookingRequestStatus,
) {
  return prisma.bookingRequest.updateMany({
    where: { id: bookingRequestId, organizationId, status: "pending" },
    data: { status },
  });
}
