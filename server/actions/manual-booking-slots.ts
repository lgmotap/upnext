"use server";

import { getAppSession } from "@/server/permissions/session";
import { canManageBookings } from "@/server/permissions/can";
import { getOrgAvailableDays, getOrgSlotsForDay } from "@/server/services/bookings";
import type { SlotDay } from "@/lib/availability/slots";

function parseAddonIds(raw: string | string[] | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

async function requireBookingManager() {
  const session = await getAppSession();
  if (!session || !canManageBookings(session)) return null;
  return session;
}

export async function fetchManualAvailableDaysAction(
  serviceId: string,
  addonServiceIds?: string | string[],
  membershipId?: string,
) {
  const session = await requireBookingManager();
  if (!session) return { days: [] as SlotDay[], timeZone: "America/New_York" };

  const addons = parseAddonIds(addonServiceIds);
  const result = await getOrgAvailableDays(
    session.organizationId,
    serviceId,
    addons,
    membershipId || undefined,
  );
  if (!result) return { days: [] as SlotDay[], timeZone: "America/New_York" };
  return result;
}

export async function fetchManualSlotsForDayAction(
  serviceId: string,
  dateYmd: string,
  addonServiceIds?: string | string[],
  membershipId?: string,
) {
  const session = await requireBookingManager();
  if (!session) return { slots: [] as { date: string; time: string; label: string }[] };

  const addons = parseAddonIds(addonServiceIds);
  const slotResult = await getOrgSlotsForDay(
    session.organizationId,
    serviceId,
    dateYmd,
    addons,
    membershipId || undefined,
  );
  if (!slotResult) return { slots: [] as { date: string; time: string; label: string }[] };
  return {
    slots: slotResult.slots.map((s) => ({ date: s.date, time: s.time, label: formatTime12h(s.time) })),
  };
}

function formatTime12h(hm: string): string {
  const [h, m] = hm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}
