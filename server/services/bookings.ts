import { getBusinessProfileBySlug } from "@/server/repositories/services";
import {
  listAvailabilityRules,
  listBlackoutDates,
  getBookingSettings,
} from "@/server/repositories/availability";
import { resolveRulesForMembership, isMembershipAvailableAtSlot } from "@/server/services/membership-availability";
import { listMembershipAvailabilityRules } from "@/server/repositories/membership-availability";
import { prisma } from "@/lib/db/prisma";
import {
  getAvailableDays,
  getSlotsForDate,
  isSlotAvailable,
  type SlotDay,
  type AvailableSlot,
} from "@/lib/availability/slots";
import type { WeeklyRule } from "@/lib/availability/intersect-rules";
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
import { emitOrgWebhook } from "@/server/services/webhooks";
import type { PricingParameterType, Service } from "@/generated/prisma/client";
import type { PricingParameterConfig } from "@/lib/pricing/parameters";
import {
  bookingPriceCents,
  defaultParameterValues,
  parseParameterInput,
} from "@/lib/pricing/parameters";
import { listPricingParametersForService } from "@/server/repositories/pricing-parameters";
import {
  listFrequencyDiscountsForService,
  toFrequencyDiscountConfigs,
} from "@/server/repositories/frequency-discounts";
import { applyFrequencyDiscount } from "@/lib/pricing/frequency-discount";
import { filterSlotsByJobConflicts } from "@/lib/scheduling/conflicts";
import type { SchedulingPolicy } from "@/lib/scheduling/policy";
import type { BookingFrequency } from "@/generated/prisma/client";
import {
  createBookingCheckoutSession,
  isPayAtBookingAvailable,
} from "@/server/services/pay-at-booking";

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
    rules: WeeklyRule[];
    blackouts: Awaited<ReturnType<typeof listBlackoutDates>>;
    minNoticeHours: number;
    maxBookingDaysAhead: number;
    slotIntervalMinutes: number;
    serviceDurationMinutes: number;
    carryOverMinutes: number;
  };
  schedulingPolicy: SchedulingPolicy;
  context: PublicBookingContext;
};

function schedulingPolicyFromProfile(profile: {
  bufferMinutesBetweenJobs?: number;
  providerCarryOverMinutes?: number;
}): SchedulingPolicy {
  return {
    bufferMinutesBetweenJobs: profile.bufferMinutesBetweenJobs ?? 0,
    providerCarryOverMinutes: profile.providerCarryOverMinutes ?? 0,
  };
}

async function filterLoadedSlots(
  organizationId: string,
  slots: AvailableSlot[],
  policy: SchedulingPolicy,
  excludeJobId?: string,
) {
  return filterSlotsByJobConflicts(organizationId, slots, policy, excludeJobId);
}

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
  const schedulingPolicy = schedulingPolicyFromProfile(profile);

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
      carryOverMinutes: schedulingPolicy.providerCarryOverMinutes,
    },
    schedulingPolicy,
    context: {
      organizationId: profile.organizationId,
      timeZone: profile.organization.timezone,
      displayName: profile.displayName,
    },
  };
}

export function bookingTotals(
  service: Service,
  addons: Service[],
  paramConfigs: PricingParameterConfig[] = [],
  paramValues: Record<string, number> = {},
  frequency: BookingFrequency = "one_time",
  frequencyDiscounts: Array<{
    frequency: BookingFrequency;
    percentOff: number;
    amountOffCents: number;
  }> = [],
) {
  const addonTotal = addons.reduce((s, a) => s + a.basePriceCents, 0);
  const subtotal = bookingPriceCents(service.basePriceCents, addonTotal, paramConfigs, paramValues);
  const priceCents = applyFrequencyDiscount(subtotal, frequency, frequencyDiscounts);
  const durationMinutes = service.durationMinutes + addons.reduce((s, a) => s + a.durationMinutes, 0);
  const label =
    addons.length > 0
      ? `${service.name} + ${addons.map((a) => a.name).join(", ")}`
      : service.name;
  return { priceCents, subtotalCents: subtotal, durationMinutes, label, currency: service.currency };
}

async function resolveParameterValues(
  serviceId: string,
  raw: Partial<Record<PricingParameterType, unknown>>,
): Promise<
  | { ok: true; configs: PricingParameterConfig[]; values: Record<PricingParameterType, number> }
  | { ok: false; error: string }
> {
  const rows = await listPricingParametersForService(serviceId);
  const configs: PricingParameterConfig[] = rows.map((r) => ({
    parameterType: r.parameterType,
    unitPriceCents: r.unitPriceCents,
    includedUnits: r.includedUnits,
    maxUnits: r.maxUnits,
  }));
  if (configs.length === 0) {
    return { ok: true, configs, values: {} as Record<PricingParameterType, number> };
  }
  const defaults = defaultParameterValues(configs);
  const merged: Partial<Record<PricingParameterType, unknown>> = {};
  for (const config of configs) {
    const rawVal = raw[config.parameterType];
    merged[config.parameterType] =
      rawVal !== undefined && rawVal !== null && rawVal !== "" ? rawVal : defaults[config.parameterType];
  }
  const parsed = parseParameterInput(configs, merged);
  if (!parsed.ok) return parsed;
  return { ok: true, configs, values: parsed.values };
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
  const slots = getSlotsForDate(loaded.slotInput, dateYmd);
  return filterLoadedSlots(loaded.profile.organizationId, slots, loaded.schedulingPolicy);
}

type SlotInput = LoadedBookingContext["slotInput"];

type OrgSlotLoaded = {
  slotInput: SlotInput;
  service: Service;
  addons: Service[];
  timeZone: string;
  schedulingPolicy: SchedulingPolicy;
};

async function loadOrgSlotContext(
  organizationId: string,
  serviceId: string,
  addonServiceIds: string[] = [],
  membershipId?: string,
  options?: { durationMinutesOverride?: number },
): Promise<OrgSlotLoaded | null> {
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
    resolveRulesForMembership(organizationId, membershipId),
    listBlackoutDates(organizationId),
    getBookingSettings(organizationId),
  ]);

  const profile = org.businessProfile;
  const computedDuration =
    service.durationMinutes + addons.reduce((sum, a) => sum + a.durationMinutes, 0);
  const serviceDurationMinutes =
    options?.durationMinutesOverride && options.durationMinutesOverride > 0
      ? options.durationMinutesOverride
      : computedDuration;
  const schedulingPolicy = schedulingPolicyFromProfile(profile);

  return {
    service,
    addons,
    timeZone: org.timezone,
    schedulingPolicy,
    slotInput: {
      timeZone: org.timezone,
      rules,
      blackouts,
      minNoticeHours: booking?.minNoticeHours ?? profile.minNoticeHours,
      maxBookingDaysAhead: booking?.maxBookingDaysAhead ?? profile.maxBookingDaysAhead,
      slotIntervalMinutes: booking?.slotIntervalMinutes ?? profile.slotIntervalMinutes,
      serviceDurationMinutes,
      carryOverMinutes: schedulingPolicy.providerCarryOverMinutes,
    },
  };
}

export async function getOrgAvailableDays(
  organizationId: string,
  serviceId: string,
  addonServiceIds: string[] = [],
  membershipId?: string,
): Promise<{ days: SlotDay[]; timeZone: string } | null> {
  const loaded = await loadOrgSlotContext(organizationId, serviceId, addonServiceIds, membershipId);
  if (!loaded) return null;
  return { days: getAvailableDays(loaded.slotInput), timeZone: loaded.timeZone };
}

export async function getOrgSlotsForDay(
  organizationId: string,
  serviceId: string,
  dateYmd: string,
  addonServiceIds: string[] = [],
  membershipId?: string,
  options?: { durationMinutesOverride?: number },
): Promise<{ slots: AvailableSlot[]; timeZone: string } | null> {
  const loaded = await loadOrgSlotContext(
    organizationId,
    serviceId,
    addonServiceIds,
    membershipId,
    options,
  );
  if (!loaded) return null;
  const slots = getSlotsForDate(loaded.slotInput, dateYmd);
  const filtered = await filterLoadedSlots(organizationId, slots, loaded.schedulingPolicy);
  return { slots: filtered, timeZone: loaded.timeZone };
}

export async function createManualBooking(organizationId: string, raw: ManualBookingInput) {
  const input = manualBookingSchema.parse(raw);
  const loaded = await loadOrgSlotContext(organizationId, input.serviceId, input.addonServiceIds);
  if (!loaded) return { ok: false as const, error: "Service not found" };

  const slot = isSlotAvailable(loaded.slotInput, input.date, input.time);
  if (!slot) return { ok: false as const, error: "Selected time is no longer available" };

  const [availableSlot] = await filterLoadedSlots(
    organizationId,
    [slot],
    loaded.schedulingPolicy,
  );
  if (!availableSlot) {
    return { ok: false as const, error: "That time conflicts with another job" };
  }

  const assignId = input.assignMembershipId?.trim();
  if (assignId) {
    const memberRules = await listMembershipAvailabilityRules(assignId);
    if (memberRules.length > 0) {
      const available = await isMembershipAvailableAtSlot(
        organizationId,
        assignId,
        input.date,
        input.time,
        loaded.slotInput.serviceDurationMinutes,
      );
      if (!available) {
        return {
          ok: false as const,
          error:
            "Selected worker is not available at this time. Choose another slot or a different worker.",
        };
      }
    }
  }

  const paramResult = await resolveParameterValues(loaded.service.id, {
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    half_bathrooms: input.half_bathrooms,
    square_feet: input.square_feet,
  });
  if (!paramResult.ok) return { ok: false as const, error: paramResult.error };

  let customerId: string;

  if (input.customerId?.trim()) {
    const existing = await getCustomerForOrg(organizationId, input.customerId.trim());
    if (!existing) return { ok: false as const, error: "Customer not found" };
    if (existing.addresses.length === 0) {
      return { ok: false as const, error: "Customer has no address on file" };
    }
    const addressId = input.customerAddressId?.trim();
    if (addressId && !existing.addresses.some((a) => a.id === addressId)) {
      return { ok: false as const, error: "Selected address not found for this customer" };
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
      emitOrgWebhook(organizationId, "customer_created", {
        customerId: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
      });
    }
  }

  const booking = await createBookingRequest({
    organizationId,
    customerId,
    serviceId: loaded.service.id,
    requestedStartAt: availableSlot.startAt,
    requestedEndAt: availableSlot.endAt,
    customerNotes: input.customerNotes || null,
    customFieldsJson: input.customFieldsJson ?? null,
    source: "manual",
    frequency: input.frequency,
    parameters: Object.entries(paramResult.values).map(([parameterType, units]) => ({
      parameterType: parameterType as PricingParameterType,
      units,
    })),
    addons: loaded.addons.map((a) => ({
      serviceId: a.id,
      name: a.name,
      priceCents: a.basePriceCents,
      durationMinutes: a.durationMinutes,
    })),
  });

  const jobResult = await createJobFromBookingRequest(organizationId, booking.id);
  if (!jobResult.ok) return jobResult;

  const selectedAddressId = input.customerAddressId?.trim();
  if (selectedAddressId) {
    await prisma.job.update({
      where: { id: jobResult.jobId },
      data: { customerAddressId: selectedAddressId },
    });
  }

  const assignIdForJob = input.assignMembershipId?.trim();
  if (assignIdForJob) {
    const assigned = await assignJobToMember(jobResult.jobId, assignIdForJob, organizationId);
    if (assigned) {
      await notifyJobAssigned(organizationId, jobResult.jobId, assignIdForJob);
    }
  }

  captureServerEvent(organizationId, AnalyticsEvents.manualBookingCreated, {
    bookingRequestId: booking.id,
    jobId: jobResult.jobId,
    source: "manual",
    serviceId: loaded.service.id,
  });

  emitOrgWebhook(organizationId, "booking_created", {
    bookingRequestId: booking.id,
    customerId,
    serviceId: loaded.service.id,
    status: "accepted",
    source: "manual",
    requestedStartAt: availableSlot.startAt.toISOString(),
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

  const [availableSlot] = await filterLoadedSlots(
    loaded.profile.organizationId,
    [slot],
    loaded.schedulingPolicy,
  );
  if (!availableSlot) {
    return { ok: false as const, error: "That time conflicts with another job" };
  }

  const paramResult = await resolveParameterValues(loaded.service.id, {
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    half_bathrooms: input.half_bathrooms,
    square_feet: input.square_feet,
  });
  if (!paramResult.ok) return { ok: false as const, error: paramResult.error };

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
    emitOrgWebhook(loaded.profile.organizationId, "customer_created", {
      customerId: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
    });
  }

  const discountRows = await listFrequencyDiscountsForService(loaded.service.id);
  const frequencyDiscounts = toFrequencyDiscountConfigs(discountRows);

  const totals = bookingTotals(
    loaded.service,
    loaded.addons,
    paramResult.configs,
    paramResult.values,
    input.frequency,
    frequencyDiscounts,
  );

  const booking = await createBookingRequest({
    organizationId: loaded.profile.organizationId,
    customerId: customer.id,
    serviceId: loaded.service.id,
    requestedStartAt: availableSlot.startAt,
    requestedEndAt: availableSlot.endAt,
    customerNotes: input.customerNotes || null,
    customFieldsJson: input.customFieldsJson ?? null,
    frequency: input.frequency,
    parameters: Object.entries(paramResult.values).map(([parameterType, units]) => ({
      parameterType: parameterType as PricingParameterType,
      units,
    })),
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
    requestedStartAt: availableSlot.startAt,
    timeZone: loaded.profile.organization.timezone,
    businessName: loaded.profile.displayName,
  });

  captureServerEvent(loaded.profile.organizationId, AnalyticsEvents.bookingRequestCreated, {
    bookingRequestId: booking.id,
    source: "public_booking",
    serviceId: loaded.service.id,
  });

  emitOrgWebhook(loaded.profile.organizationId, "booking_created", {
    bookingRequestId: booking.id,
    customerId: customer.id,
    serviceId: loaded.service.id,
    status: "pending",
    source: "public_booking",
    requestedStartAt: availableSlot.startAt.toISOString(),
  });

  return { ok: true as const, bookingRequestId: booking.id };
}

export async function createPublicBookingCheckout(raw: PublicBookingInput) {
  const input = publicBookingSchema.parse(raw);
  const loaded = await loadSlotContext(input.businessSlug, input.serviceId, input.addonServiceIds);
  if (!loaded) return { ok: false as const, error: "Business or service not found" };

  const payAvailable = await isPayAtBookingAvailable(loaded.profile.organizationId);
  if (!payAvailable) {
    return { ok: false as const, error: "Online payment at booking is not available" };
  }

  const slot = isSlotAvailable(loaded.slotInput, input.date, input.time);
  if (!slot) return { ok: false as const, error: "Selected time is no longer available" };

  const [availableSlot] = await filterLoadedSlots(
    loaded.profile.organizationId,
    [slot],
    loaded.schedulingPolicy,
  );
  if (!availableSlot) {
    return { ok: false as const, error: "That time conflicts with another job" };
  }

  const paramResult = await resolveParameterValues(loaded.service.id, {
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    half_bathrooms: input.half_bathrooms,
    square_feet: input.square_feet,
  });
  if (!paramResult.ok) return { ok: false as const, error: paramResult.error };

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
    emitOrgWebhook(loaded.profile.organizationId, "customer_created", {
      customerId: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
    });
  }

  const discountRows = await listFrequencyDiscountsForService(loaded.service.id);
  const frequencyDiscounts = toFrequencyDiscountConfigs(discountRows);
  const totals = bookingTotals(
    loaded.service,
    loaded.addons,
    paramResult.configs,
    paramResult.values,
    input.frequency,
    frequencyDiscounts,
  );

  const booking = await createBookingRequest({
    organizationId: loaded.profile.organizationId,
    customerId: customer.id,
    serviceId: loaded.service.id,
    requestedStartAt: availableSlot.startAt,
    requestedEndAt: availableSlot.endAt,
    customerNotes: input.customerNotes || null,
    frequency: input.frequency,
    parameters: Object.entries(paramResult.values).map(([parameterType, units]) => ({
      parameterType: parameterType as PricingParameterType,
      units,
    })),
    addons: loaded.addons.map((a) => ({
      serviceId: a.id,
      name: a.name,
      priceCents: a.basePriceCents,
      durationMinutes: a.durationMinutes,
    })),
  });

  const checkout = await createBookingCheckoutSession({
    organizationId: loaded.profile.organizationId,
    businessSlug: input.businessSlug,
    bookingRequestId: booking.id,
    customerId: customer.id,
    customerEmail: input.email,
    serviceLabel: totals.label,
    amountCents: totals.priceCents,
    currency: loaded.service.currency,
  });

  if (!checkout.ok || !checkout.url) {
    return { ok: false as const, error: checkout.error ?? "Could not start checkout" };
  }

  captureServerEvent(loaded.profile.organizationId, AnalyticsEvents.bookingRequestCreated, {
    bookingRequestId: booking.id,
    source: "public_booking",
    serviceId: loaded.service.id,
    payAtBooking: true,
  });

  emitOrgWebhook(loaded.profile.organizationId, "booking_created", {
    bookingRequestId: booking.id,
    customerId: customer.id,
    serviceId: loaded.service.id,
    status: "pending",
    source: "public_booking",
    requestedStartAt: availableSlot.startAt.toISOString(),
    payAtBooking: true,
  });

  return {
    ok: true as const,
    checkoutUrl: checkout.url,
    bookingRequestId: booking.id,
    paymentRecordId: checkout.paymentRecordId,
  };
}

export async function declineBookingRequest(organizationId: string, bookingRequestId: string) {
  const result = await updateBookingRequestStatus(organizationId, bookingRequestId, "declined");
  if (result.count === 0) return { ok: false as const, error: "Booking not found or already handled" };

  const { notifyBookingDeclined } = await import("@/server/services/notifications");
  await notifyBookingDeclined(organizationId, bookingRequestId);

  return { ok: true as const };
}
