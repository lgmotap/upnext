"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppSession } from "@/server/permissions/session";
import { canManageBusiness } from "@/server/permissions/can";
import { locationFormSchema } from "@/server/validators/locations";
import {
  createLocationForOrg,
  listLocationsForOrg,
  updateLocationForOrg,
} from "@/server/repositories/locations";

function parseLocationForm(formData: FormData) {
  return locationFormSchema.safeParse({
    name: formData.get("name"),
    isDefault: formData.get("isDefault"),
    isActive: formData.get("isActive"),
    addressLine1: formData.get("addressLine1") ?? "",
    addressLine2: formData.get("addressLine2") ?? "",
    city: formData.get("city") ?? "",
    region: formData.get("region") ?? "",
    postalCode: formData.get("postalCode") ?? "",
    country: formData.get("country") ?? "US",
    phone: formData.get("phone") ?? "",
    timezone: formData.get("timezone") ?? "",
  });
}

export async function createLocationAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageBusiness(session)) {
    redirect("/app/settings/locations?error=Permission%20denied");
  }

  const parsed = parseLocationForm(formData);
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? "Invalid input";
    redirect(`/app/settings/locations?error=${encodeURIComponent(msg)}`);
  }

  const existing = await listLocationsForOrg(session.organizationId);
  const isFirst = existing.length === 0;

  await createLocationForOrg(session.organizationId, {
    ...parsed.data,
    isDefault: parsed.data.isDefault || isFirst,
    addressLine1: parsed.data.addressLine1 || null,
    addressLine2: parsed.data.addressLine2 || null,
    city: parsed.data.city || null,
    region: parsed.data.region || null,
    postalCode: parsed.data.postalCode || null,
    phone: parsed.data.phone || null,
    timezone: parsed.data.timezone || null,
  });

  revalidatePath("/app/settings/locations");
  revalidatePath("/book");
  redirect("/app/settings/locations?saved=1");
}

export async function updateLocationAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageBusiness(session)) {
    redirect("/app/settings/locations?error=Permission%20denied");
  }

  const locationId = String(formData.get("locationId") ?? "");
  if (!locationId) redirect("/app/settings/locations?error=Missing%20location");

  const parsed = parseLocationForm(formData);
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? "Invalid input";
    redirect(`/app/settings/locations?error=${encodeURIComponent(msg)}`);
  }

  try {
    const updated = await updateLocationForOrg(session.organizationId, locationId, {
      name: parsed.data.name,
      isDefault: parsed.data.isDefault,
      isActive: parsed.data.isActive,
      addressLine1: parsed.data.addressLine1 || null,
      addressLine2: parsed.data.addressLine2 || null,
      city: parsed.data.city || null,
      region: parsed.data.region || null,
      postalCode: parsed.data.postalCode || null,
      country: parsed.data.country,
      phone: parsed.data.phone || null,
      timezone: parsed.data.timezone || null,
    });
    if (!updated) redirect("/app/settings/locations?error=Location%20not%20found");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not update location";
    redirect(`/app/settings/locations?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/app/settings/locations");
  revalidatePath("/book");
  redirect("/app/settings/locations?saved=1");
}
