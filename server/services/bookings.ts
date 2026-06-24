import { getBusinessProfileBySlug } from "@/server/repositories/services";
import {
  listAvailabilityRules,
  listBlackoutDates,
  getBookingSettings,
} from "@/server/repositories/availability";
import { prisma } from "@/lib/db/prisma";
import {
  getAvailableDays,
  getSlotsForDate,
  isSlotAvailable,
  type SlotDay,
  type AvailableSlot,
} from "@/lib/availability/slots";
import type { PublicBookingInput, ManualBookingInput } from "@/server/validators/booking";
import { publicBookingSchema, manualBookingSchema } from "@/server/validators/booking";
import {
  findCustomerByEmail,
  createCustomerWithAddress,
  updateCustomerContact,
  getCustomerForOrg,
} from "@/server/repositories/customers";
import { createBookingRequest, updateBookingRequestStatus } from "@/server/repositories/bookings";
import { notifyBookingRequestReceived, notifyJobAssigned } from "@/server/services/notifications";
import { createJobFromBookingRequest } from "@/server/services/jobs";
import { assignJobToMember } from "@/server/repositories/assignments";
import { captureServerEvent } from "@/lib/posthog/server";
import { AnalyticsEvents } from "@/lib/posthog/events";
import type { Service } from "@/generated/prisma/client";

export type PublicBookingContext = {
  organizationId: string;
  timeZone: string;
  displayName: string;
};

type LoadedBookingContext = {
  profile: NonNullable<Awaited<ReturnType<typeof getBusinessProfileBySlug>>>;
  service: Service;
  addons: Service[];
  slotInput: {
    timeZone: string;
    rules: Awaited<ReturnType<typeof listAvailabilityRules>>;
    blackouts: Awaited<ReturnType<typeof listBlackoutDates>>;
    minNoticeHours: number;
    maxBookingDaysAhead: number;
    slotIntervalMinutes: number;
    serviceDurationMinutes: number;
  };
  context: PublicBookingContext;
};

async function loadSlotContext(
  businessSlug: string,
  serviceId: string,
  addonServiceIds: string[] = [],
): Promise<LoadedBookingContext | null> {
  const profile = await getBusinessProfileBySlug(businessSlug);
  if (!profile || !profile.bookingEnabled) return null;

  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      organizationId: profile.organizationId,
      isActive: true,
      isPublic: true,
      isAddon: false,
    },
  });
  if (!service) return null;

  const uniqueAddonIds = [...new Set(addonServiceIds)];
  const addons =
    uniqueAddonIds.length > 0
      ? await prisma.service.findMany({
          where: {
            id: { in: uniqueAddonIds },
            organizationId: profile.organizationId,
            isActive: true,
            isPublic: true,
            isAddon: true,
          },
        })
      : [];

  if (addons.length !== uniqueAddonIds.length) return null;

  const [rules, blackouts, booking] = await Promise.all([
    listAvailabilityRules(profile.organizationId),
    listBlackoutDates(profile.organizationId),
    getBookingSettings(profile.organizationId),
  ]);

  const serviceDurationMinutes =
    service.durationMinutes + addons.reduce((sum, a) => sum + a.durationMinutes, 0);

  return {
    profile,
    service,
    addons,
    slotInput: {
      timeZone: profile.organization.timezone,
      rules,
      blackouts,
      minNoticeHours: booking?.minNoticeHours ?? profile.minNoticeHours,
      maxBookingDaysAhead: booking?.maxBookingDaysAhead ?? profile.maxBookingDaysAhead,
      slotIntervalMinutes: booking?.slotIntervalMinutes ?? profile.slotIntervalMinutes,
      serviceDurationMinutes,
    },
    context: {
      organizationId: profile.organizationId,
      timeZone: profile.organization.timezone,
      displayName: profile.displayName,
    },
  };
}

export function bookingTotals(service: Service, addons: Service[]) {
  const priceCents = service.basePriceCents + addons.reduce((s, a) => s + a.basePriceCents, 0);
  const durationMinutes = service.durationMinutes + addons.reduce((s, a) => s + a.durationMinutes, 0);
  const label =
    addons.length > 0
      ? `${service.name} + ${addons.map((a) => a.name).join(", ")}`
      : service.name;
  return { priceCents, durationMinutes, label, currency: service.currency };
}

export async function getPublicAvailableDays(
  businessSlug: string,
  serviceId: string,
  addonServiceIds: string[] = [],
): Promise<{ days: SlotDay[]; context: PublicBookingContext } | null> {
  const loaded = await loadSlotContext(businessSlug, serviceId, addonServiceIds);
  if (!loaded) return null;
  return { days: getAvailableDays(loaded.slotInput), context: loaded.context };
}

export async function getPublicSlotsForDay(
  businessSlug: string,
  serviceId: string,
  dateYmd: string,
  addonServiceIds: string[] = [],
): Promise<AvailableSlot[] | null> {
  const loaded = await loadSlotContext(businessSlug, serviceId, addonServiceIds);
  if (!loaded) return null;
  return getSlotsForDate(loaded.slotInput, dateYmd);
}

type SlotInput = LoadedBookingContext["slotInput"];

async function loadOrgSlotContext(
  organizationId: string,
  serviceId: string,
  addonServiceIds: string[] = [],
): Promise<{ slotInput: SlotInput; service: Service; addons: Service[]; timeZone: string } | null> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: { businessProfile: true },
  });
  if (!org?.businessProfile) return null;

  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      organizationId,
      isActive: true,
      isAddon: false,
    },
  });
  if (!service) return null;

  const uniqueAddonIds = [...new Set(addonServiceIds)];
  const addons =
    uniqueAddonIds.length > 0
      ? await prisma.service.findMany({
          where: {
            id: { in: uniqueAddonIds },
            organizationId,
            isActive: true,
            isAddon: true,
          },
        })
      : [];

  if (addons.length !== uniqueAddonIds.length) return null;

  const [rules, blackouts, booking] = await Promise.all([
    listAvailabilityRules(organizationId),
    listBlackoutDates(organizationId),
    getBookingSettings(organizationId),
  ]);

  const profile = org.businessProfile;
  const serviceDurationMinutes =
    service.durationMinutes + addons.reduce((sum, a) => sum + a.durationMinutes, 0);

  return {
    service,
    addons,
    timeZone: org.timezone,
    slotInput: {
      timeZone: org.timezone,
      rules,
      blackouts,
      minNoticeHours: booking?.minNoticeHours ?? profile.minNoticeHours,
      maxBookingDaysAhead: booking?.maxBookingDaysAhead ?? profile.maxBookingDaysAhead,
      slotIntervalMinutes: booking?.slotIntervalMinutes ?? profile.slotIntervalMinutes,
      serviceDurationMinutes,
    },
  };
}

export async function getOrgAvailableDays(
  organizationId: string,
  serviceId: string,
  addonServiceIds: string[] = [],
): Promise<{ days: SlotDay[]; timeZone: string } | null> {
  const loaded = await loadOrgSlotContext(organizationId, serviceId, addonServiceIds);
  if (!loaded) return null;
  return { days: getAvailableDays(loaded.slotInput), timeZone: loaded.timeZone };
}

export async function getOrgSlotsForDay(
  organizationId: string,
  serviceId: string,
  dateYmd: string,
  addonServiceIds: string[] = [],
): Promise<AvailableSlot[] | null> {
  const loaded = await loadOrgSlotContext(organizationId, serviceId, addonServiceIds);
  if (!loaded) return null;
  return getSlotsForDate(loaded.slotInput, dateYmd);
}

export async function createManualBooking(organizationId: string, raw: ManualBookingInput) {
  const input = manualBookingSchema.parse(raw);
  const loaded = await loadOrgSlotContext(organizationId, input.serviceId, input.addonServiceIds);
  if (!loaded) return { ok: false as const, error: "Service not found" };

  const slot = isSlotAvailable(loaded.slotInput, input.date, input.time);
  if (!slot) return { ok: false as const, error: "Selected time is no longer available" };

  let customerId: string;

  if (input.customerId?.trim()) {
    const existing = await getCustomerForOrg(organizationId, input.customerId.trim());
    if (!existing) return { ok: false as const, error: "Customer not found" };
    if (existing.addresses.length === 0) {
      return { ok: false as const, error: "Customer has no address on file" };
    }
    customerId = existing.id;
  } else {
    const email = input.email!.trim().toLowerCase();
    let customer = await findCustomerByEmail(organizationId, email);

    if (customer) {
      await updateCustomerContact(customer.id, organizationId, {
        firstName: input.firstName!.trim(),
        lastName: input.lastName!.trim(),
        phone: input.phone || null,
      });
      customerId = customer.id;
    } else {
      customer = await createCustomerWithAddress(organizationId, {
        firstName: input.firstName!.trim(),
        lastName: input.lastName!.trim(),
        email,
        phone: input.phone || null,
        line1: input.line1!.trim(),
        line2: input.line2 || null,
        city: input.city!.trim(),
        region: input.region!.trim(),
        postalCode: input.postalCode!.trim(),
        customerNotes: input.customerNotes || null,
      });
      customerId = customer.id;
    }
  }

  const booking = await createBookingRequest({
    organizationId,
    customerId,
    serviceId: loaded.service.id,
    requestedStartAt: slot.startAt,
    requestedEndAt: slot.endAt,
    customerNotes: input.customerNotes || null,
    source: "manual",
    frequency: input.frequency,
    addons: loaded.addons.map((a) => ({
      serviceId: a.id,
      name: a.name,
      priceCents: a.basePriceCents,
      durationMinutes: a.durationMinutes,
    })),
  });

  const jobResult = await createJobFromBookingRequest(organizationId, booking.id);
  if (!jobResult.ok) return jobResult;

  const assignId = input.assignMembershipId?.trim();
  if (assignId) {
    const assigned = await assignJobToMember(jobResult.jobId, assignId, organizationId);
    if (assigned) {
      await notifyJobAssigned(organizationId, jobResult.jobId, assignId);
    }
  }

  captureServerEvent(organizationId, AnalyticsEvents.manualBookingCreated, {
    bookingRequestId: booking.id,
    jobId: jobResult.jobId,
    source: "manual",
    serviceId: loaded.service.id,
  });

  return {
    ok: true as const,
    jobId: jobResult.jobId,
    bookingRequestId: booking.id,
  };
}

export async function createPublicBooking(raw: PublicBookingInput) {
  const input = publicBookingSchema.parse(raw);
  const loaded = await loadSlotContext(input.businessSlug, input.serviceId, input.addonServiceIds);
  if (!loaded) return { ok: false as const, error: "Business or service not found" };

  const slot = isSlotAvailable(loaded.slotInput, input.date, input.time);
  if (!slot) return { ok: false as const, error: "Selected time is no longer available" };

  let customer = await findCustomerByEmail(loaded.profile.organizationId, input.email);

  if (customer) {
    await updateCustomerContact(customer.id, loaded.profile.organizationId, {
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone || null,
    });
  } else {
    customer = await createCustomerWithAddress(loaded.profile.organizationId, {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone || null,
      line1: input.line1,
      line2: input.line2 || null,
      city: input.city,
      region: input.region,
      postalCode: input.postalCode,
      customerNotes: input.customerNotes || null,
    });
  }

  const totals = bookingTotals(loaded.service, loaded.addons);

  const booking = await createBookingRequest({
    organizationId: loaded.profile.organizationId,
    customerId: customer.id,
    serviceId: loaded.service.id,
    requestedStartAt: slot.startAt,
    requestedEndAt: slot.endAt,
    customerNotes: input.customerNotes || null,
    frequency: input.frequency,
    addons: loaded.addons.map((a) => ({
      serviceId: a.id,
      name: a.name,
      priceCents: a.basePriceCents,
      durationMinutes: a.durationMinutes,
    })),
  });

  await notifyBookingRequestReceived({
    organizationId: loaded.profile.organizationId,
    bookingRequestId: booking.id,
    customerEmail: input.email,
    customerName: `${input.firstName} ${input.lastName}`.trim(),
    serviceName: totals.label,
    requestedStartAt: slot.startAt,
    timeZone: loaded.profile.organization.timezone,
    businessName: loaded.profile.displayName,
  });

  captureServerEvent(loaded.profile.organizationId, AnalyticsEvents.bookingRequestCreated, {
    bookingRequestId: booking.id,
    source: "public_booking",
    serviceId: loaded.service.id,
  });

  return { ok: true as const, bookingRequestId: booking.id };
}

export async function declineBookingRequest(organizationId: string, bookingRequestId: string) {
  const result = await updateBookingRequestStatus(organizationId, bookingRequestId, "declined");
  if (result.count === 0) return { ok: false as const, error: "Booking not found or already handled" };

  const { notifyBookingDeclined } = await import("@/server/services/notifications");
  await notifyBookingDeclined(organizationId, bookingRequestId);

  return { ok: true as const };
}
