"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppSession } from "@/server/permissions/session";
import { canManageServices } from "@/server/permissions/can";
import {
  availabilityRuleSchema,
  bookingWindowSchema,
  blackoutDateSchema,
} from "@/server/validators/availability";
import {
  addBlackoutDate,
  removeBlackoutDate,
  saveBookingWindow,
  saveWeeklyAvailability,
} from "@/server/services/availability";

function redirectWithError(path: string, error: string): never {
  redirect(`${path}?error=${encodeURIComponent(error)}`);
}

export async function saveWeeklyAvailabilityAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageServices(session)) {
    redirectWithError("/app/settings/availability", "Permission denied");
  }

  const rules = [];
  for (let day = 0; day < 7; day++) {
    const parsed = availabilityRuleSchema.safeParse({
      dayOfWeek: day,
      startTime: formData.get(`startTime_${day}`),
      endTime: formData.get(`endTime_${day}`),
      isActive: formData.get(`isActive_${day}`) === "on",
    });
    if (!parsed.success) {
      redirectWithError("/app/settings/availability", `Invalid hours for day ${day}`);
    }
    rules.push(parsed.data);
  }

  await saveWeeklyAvailability(session.organizationId, { rules });
  revalidatePath("/app/settings/availability");
  revalidatePath("/book");
  redirect("/app/settings/availability?saved=1");
}

export async function saveBookingWindowAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageServices(session)) {
    redirectWithError("/app/settings/availability", "Permission denied");
  }

  const parsed = bookingWindowSchema.safeParse({
    minNoticeHours: formData.get("minNoticeHours"),
    maxBookingDaysAhead: formData.get("maxBookingDaysAhead"),
    slotIntervalMinutes: formData.get("slotIntervalMinutes"),
  });

  if (!parsed.success) {
    redirectWithError("/app/settings/availability", "Invalid booking window settings");
  }

  await saveBookingWindow(session.organizationId, parsed.data);
  revalidatePath("/app/settings/availability");
  revalidatePath("/book");
  redirect("/app/settings/availability?saved=1");
}

export async function addBlackoutDateAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageServices(session)) return;

  const startsRaw = String(formData.get("startsAt") ?? "");
  const endsRaw = String(formData.get("endsAt") ?? "");
  const startsAt = new Date(startsRaw);
  const endsAt = new Date(endsRaw);

  const parsed = blackoutDateSchema.safeParse({
    startsAt,
    endsAt,
    reason: formData.get("reason"),
  });

  if (!parsed.success || endsAt <= startsAt) return;

  await addBlackoutDate(session.organizationId, {
    startsAt: parsed.data.startsAt,
    endsAt: parsed.data.endsAt,
    reason: parsed.data.reason || null,
  });

  revalidatePath("/app/settings/availability");
  revalidatePath("/book");
}

export async function removeBlackoutDateAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageServices(session)) return;

  const id = String(formData.get("blackoutId") ?? "");
  if (!id) return;

  await removeBlackoutDate(session.organizationId, id);
  revalidatePath("/app/settings/availability");
  revalidatePath("/book");
}
