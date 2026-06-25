import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, PageHeader } from "@/components/app/ui";
import { getAppSession } from "@/server/permissions/session";
import { canManageBookings } from "@/server/permissions/can";
import { listActivePrimaryServicesForOrg, listActiveAddonServicesForOrg } from "@/server/repositories/services";
import { listPricingParametersForServices } from "@/server/repositories/pricing-parameters";
import type { PricingParameterConfig } from "@/lib/pricing/parameters";
import { listFrequencyDiscountsForServices } from "@/server/repositories/frequency-discounts";
import { listActiveBookingFormFields } from "@/server/repositories/booking-form-fields";
import { getAssignableMembers } from "@/server/repositories/team";
import { getOrgAvailableDays, getOrgSlotsForDay } from "@/server/services/bookings";
import { isPayAtBookingAvailable } from "@/server/services/pay-at-booking";
import { prisma } from "@/lib/db/prisma";
import type { BookableDay } from "@/lib/availability/calendar-ui";
import { isStripeConfigured } from "@/server/services/payments";
import { ManualBookingClient } from "./ManualBookingClient";

function formatAddressLabel(line1: string, city: string, region: string, postalCode: string) {
  return `${line1}, ${city}, ${region} ${postalCode}`;
}

function formatTime12h(hm: string): string {
  const [h, m] = hm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export default async function NewManualBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; customerId?: string }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/sign-in?next=/app/bookings/new");
  if (!canManageBookings(session)) redirect("/app/bookings?error=denied");

  const params = await searchParams;
  const orgId = session.organizationId;

  const [org, primaryServices, addonServices, customers, assignableMembers, businessProfile, customFormFields, payAtBookingAvailable] =
    await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { timezone: true, stripeConnectChargesEnabled: true },
    }),
    listActivePrimaryServicesForOrg(orgId),
    listActiveAddonServicesForOrg(orgId),
    prisma.customer.findMany({
      where: { organizationId: orgId, addresses: { some: {} } },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      include: {
        addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] },
      },
    }),
    getAssignableMembers(orgId),
    prisma.businessProfile.findUnique({
      where: { organizationId: orgId },
      select: {
        payAtBookingEnabled: true,
        requirePaymentAtBooking: true,
        serviceAreaEnforcementMode: true,
      },
    }),
    listActiveBookingFormFields(orgId),
    isPayAtBookingAvailable(orgId),
  ]);

  const serviceIds = [...primaryServices, ...addonServices].map((s) => s.id);
  const paramRows = await listPricingParametersForServices(serviceIds);
  const discountRows = await listFrequencyDiscountsForServices(serviceIds);
  const paramsByService = new Map(serviceIds.map((id) => [id, [] as PricingParameterConfig[]]));
  const discountsByService = new Map(
    serviceIds.map((id) => [id, [] as { frequency: "weekly" | "biweekly" | "monthly" | "one_time"; percentOff: number; amountOffCents: number }[]]),
  );
  for (const row of paramRows) {
    paramsByService.get(row.serviceId)?.push({
      parameterType: row.parameterType,
      unitPriceCents: row.unitPriceCents,
      includedUnits: row.includedUnits,
      maxUnits: row.maxUnits,
    });
  }
  for (const row of discountRows) {
    discountsByService.get(row.serviceId)?.push({
      frequency: row.frequency,
      percentOff: row.percentOff,
      amountOffCents: row.amountOffCents,
    });
  }

  const mapServiceOption = (s: (typeof primaryServices)[number]) => ({
    id: s.id,
    name: s.name,
    durationMinutes: s.durationMinutes,
    basePriceCents: s.basePriceCents,
    currency: s.currency,
    description: s.description,
    pricingParameters: paramsByService.get(s.id) ?? [],
    frequencyDiscounts: discountsByService.get(s.id) ?? [],
  });

  const timeZone = org?.timezone ?? "America/New_York";
  const initialServiceId = primaryServices[0]?.id ?? "";

  let initialDays: BookableDay[] = [];
  let initialSlots: Array<{ date: string; time: string; label: string }> = [];
  let initialDate = "";
  let initialTime = "";

  if (initialServiceId) {
    const daysResult = await getOrgAvailableDays(orgId, initialServiceId);
    initialDays = daysResult?.days ?? [];
    initialDate = initialDays[0]?.date ?? "";
    if (initialDate) {
      const slotResult = await getOrgSlotsForDay(orgId, initialServiceId, initialDate);
      const slots = slotResult?.slots ?? [];
      initialSlots = slots.map((s) => ({ date: s.date, time: s.time, label: formatTime12h(s.time) }));
      initialTime = initialSlots[0]?.time ?? "";
    }
  }

  const customerOptions = customers.map((c) => ({
    id: c.id,
    label: `${c.firstName} ${c.lastName}`,
    email: c.email,
    addresses: c.addresses.map((a) => ({
      id: a.id,
      isDefault: a.isDefault,
      label: formatAddressLabel(a.line1, a.city, a.region, a.postalCode),
    })),
  }));

  const memberOptions = assignableMembers.map((m) => ({
    id: m.id,
    label: m.user.name || m.user.email,
    role: m.role,
  }));

  const showPaymentStep =
    Boolean(businessProfile?.payAtBookingEnabled) &&
    Boolean(org?.stripeConnectChargesEnabled) &&
    isStripeConfigured() &&
    payAtBookingAvailable;

  const initialCustomerId =
    params.customerId && customerOptions.some((c) => c.id === params.customerId)
      ? params.customerId
      : (customerOptions[0]?.id ?? "");

  return (
    <>
      <Link
        href="/app/bookings"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft className="size-4" /> Back to bookings
      </Link>

      <PageHeader
        title="New booking"
        subtitle="Phone or walk-in — pick a customer, service, and time. Creates a scheduled job immediately."
      />

      {params.error && (
        <p className="mb-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-rose-100">
          {params.error === "denied"
            ? "You do not have permission to create bookings."
            : params.error === "invalid"
              ? "Please check all required fields."
              : decodeURIComponent(params.error)}
        </p>
      )}

      <Card className="p-4 sm:p-6">
        <ManualBookingClient
          timeZone={timeZone}
          primaryServices={primaryServices.map(mapServiceOption)}
          addonServices={addonServices.map(mapServiceOption)}
          customers={customerOptions}
          assignableMembers={memberOptions}
          initialDays={initialDays}
          initialSlots={initialSlots}
          initialServiceId={initialServiceId}
          initialCustomerId={initialCustomerId}
          initialDate={initialDate}
          initialTime={initialTime}
          customFormFields={customFormFields}
          payAtBooking={{
            showPaymentStep,
            requirePaymentAtBooking: Boolean(businessProfile?.requirePaymentAtBooking),
          }}
          serviceAreaEnforcementEnabled={
            businessProfile?.serviceAreaEnforcementMode !== undefined &&
            businessProfile.serviceAreaEnforcementMode !== "off"
          }
        />
      </Card>
    </>
  );
}
