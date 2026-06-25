"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppSession } from "@/server/permissions/session";
import { canManageBusiness } from "@/server/permissions/can";
import { customBookingHostSchema } from "@/server/validators/custom-booking-domain";
import {
  clearCustomBookingHost,
  saveCustomBookingHost,
  verifyCustomBookingHostForOrg,
} from "@/server/services/custom-booking-domain";

export async function saveCustomBookingHostAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageBusiness(session)) {
    redirect("/app/settings/portals?error=Permission%20denied");
  }

  const raw = String(formData.get("customBookingHost") ?? "").trim();
  if (!raw) {
    await clearCustomBookingHost(session.organizationId);
    revalidatePath("/app/settings/portals");
    redirect("/app/settings/portals?saved=custom_host");
  }

  const parsed = customBookingHostSchema.safeParse({ customBookingHost: raw });
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors.customBookingHost?.[0] ?? "Invalid host";
    redirect(`/app/settings/portals?error=${encodeURIComponent(msg)}`);
  }

  const result = await saveCustomBookingHost(session.organizationId, parsed.data.customBookingHost);
  if (!result.ok) {
    redirect(`/app/settings/portals?error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/app/settings/portals");
  redirect("/app/settings/portals?saved=custom_host");
}

export async function verifyCustomBookingHostAction(): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageBusiness(session)) {
    redirect("/app/settings/portals?error=Permission%20denied");
  }

  const result = await verifyCustomBookingHostForOrg(session.organizationId);
  if (!result.ok) {
    redirect(`/app/settings/portals?error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/app/settings/portals");
  revalidatePath("/book");
  redirect("/app/settings/portals?saved=custom_host_verified");
}
