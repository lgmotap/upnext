"use server";

import { getPublicAvailableDays, getPublicSlotsForDay } from "@/server/services/bookings";
import type { SlotDay } from "@/lib/availability/slots";

function parseAddonIds(raw: string | string[] | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export async function fetchAvailableDaysAction(
  businessSlug: string,
  serviceId: string,
  addonServiceIds?: string | string[],
) {
  const addons = parseAddonIds(addonServiceIds);
  const result = await getPublicAvailableDays(businessSlug, serviceId, addons);
  if (!result) return { days: [] as SlotDay[], timeZone: "America/New_York" };
  return { days: result.days, timeZone: result.context.timeZone };
}

export async function fetchSlotsForDayAction(
  businessSlug: string,
  serviceId: string,
  dateYmd: string,
  addonServiceIds?: string | string[],
) {
  const addons = parseAddonIds(addonServiceIds);
  const slots = await getPublicSlotsForDay(businessSlug, serviceId, dateYmd, addons);
  if (!slots) return { slots: [] as { date: string; time: string; label: string }[] };
  return {
    slots: slots.map((s) => ({ date: s.date, time: s.time, label: formatTime12h(s.time) })),
  };
}

function formatTime12h(hm: string): string {
  const [h, m] = hm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}
