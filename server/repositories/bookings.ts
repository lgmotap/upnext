import { prisma } from "@/lib/db/prisma";
import type { BookingFrequency, BookingRequestStatus, PricingParameterType } from "@/generated/prisma/client";

export function listBookingRequestsForOrg(organizationId: string, status?: BookingRequestStatus) {
  return prisma.bookingRequest.findMany({
    where: { organizationId, ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
    include: {
      customer: { include: { addresses: { where: { isDefault: true }, take: 1 } } },
      service: true,
      addons: true,
      parameters: true,
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
