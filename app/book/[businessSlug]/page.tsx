import { notFound } from "next/navigation";
import {
  getBusinessProfileBySlug,
  listPublicPrimaryServicesForOrg,
  listPublicAddonServicesForOrg,
} from "@/server/repositories/services";
import { getPublicAvailableDays, getPublicSlotsForDay } from "@/server/services/bookings";
import { PublicBookingClient } from "./PublicBookingClient";

function formatTime12h(hm: string): string {
  const [h, m] = hm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function mapService(s: {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  basePriceCents: number;
  currency: string;
  isAddon: boolean;
}) {
  return {
    id: s.id,
    name: s.name,
    description: s.description,
    durationMinutes: s.durationMinutes,
    basePriceCents: s.basePriceCents,
    currency: s.currency,
    isAddon: s.isAddon,
  };
}

export default async function PublicBookingPage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  const profile = await getBusinessProfileBySlug(businessSlug);

  if (!profile || !profile.bookingEnabled) {
    notFound();
  }

  const [primaryServices, addonServices] = await Promise.all([
    listPublicPrimaryServicesForOrg(profile.organizationId),
    listPublicAddonServicesForOrg(profile.organizationId),
  ]);

  if (primaryServices.length === 0) {
    notFound();
  }

  const firstService = primaryServices[0];
  const daysResult = await getPublicAvailableDays(businessSlug, firstService.id, []);
  const days = daysResult?.days ?? [];
  const timeZone = profile.organization.timezone;
  const firstDate = days[0]?.date ?? "";
  const rawSlots = firstDate
    ? ((await getPublicSlotsForDay(businessSlug, firstService.id, firstDate, [])) ?? [])
    : [];
  const initialSlots = rawSlots.map((s) => ({
    date: s.date,
    time: s.time,
    label: formatTime12h(s.time),
  }));

  return (
    <PublicBookingClient
      businessSlug={businessSlug}
      timeZone={timeZone}
      business={{
        displayName: profile.displayName,
        serviceArea: profile.serviceArea,
        description: profile.description,
      }}
      primaryServices={primaryServices.map(mapService)}
      addonServices={addonServices.map(mapService)}
      initialDays={days}
      initialSlots={initialSlots}
      initialServiceId={firstService.id}
      initialDate={firstDate}
      initialTime={initialSlots[0]?.time ?? ""}
    />
  );
}
