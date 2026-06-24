import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, PageHeader } from "@/components/app/ui";
import { getAppSession } from "@/server/permissions/session";
import { canManageBookings } from "@/server/permissions/can";
import { listActivePrimaryServicesForOrg, listActiveAddonServicesForOrg } from "@/server/repositories/services";
import { listPricingParametersForServices } from "@/server/repositories/pricing-parameters";
import { listCustomersForOrg } from "@/server/repositories/customers";
import { getAssignableMembers } from "@/server/repositories/team";
import { getOrgAvailableDays, getOrgSlotsForDay } from "@/server/services/bookings";
import { prisma } from "@/lib/db/prisma";
import type { BookableDay } from "@/lib/availability/calendar-ui";
import { ManualBookingClient } from "./ManualBookingClient";

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

  const [org, primaryServices, addonServices, customers, assignableMembers] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { timezone: true },
    }),
    listActivePrimaryServicesForOrg(orgId),
    listActiveAddonServicesForOrg(orgId),
    listCustomersForOrg(orgId),
    getAssignableMembers(orgId),
  ]);

  const serviceIds = [...primaryServices, ...addonServices].map((s) => s.id);
  const paramRows = await listPricingParametersForServices(serviceIds);
  const paramsByService = new Map(
    serviceIds.map((id) => [id, [] as { parameterType: "bedrooms" | "bathrooms"; unitPriceCents: number; includedUnits: number; maxUnits: number }[]]),
  );
  for (const row of paramRows) {
    paramsByService.get(row.serviceId)?.push({
      parameterType: row.parameterType,
      unitPriceCents: row.unitPriceCents,
      includedUnits: row.includedUnits,
      maxUnits: row.maxUnits,
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
      const slots = (await getOrgSlotsForDay(orgId, initialServiceId, initialDate)) ?? [];
      initialSlots = slots.map((s) => ({ date: s.date, time: s.time, label: formatTime12h(s.time) }));
      initialTime = initialSlots[0]?.time ?? "";
    }
  }

  const customerOptions = customers
    .filter((c) => c.addresses.length > 0)
    .map((c) => {
    const address = c.addresses[0];
    const addressLine = address
      ? `${address.line1}, ${address.city}, ${address.region} ${address.postalCode}`
      : "No address";
    return {
      id: c.id,
      label: `${c.firstName} ${c.lastName}`,
      email: c.email,
      addressLine,
    };
  });

  const memberOptions = assignableMembers.map((m) => ({
    id: m.id,
    label: m.user.name || m.user.email,
    role: m.role,
  }));

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
        />
      </Card>
    </>
  );
}
