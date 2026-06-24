"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppSession } from "@/server/permissions/session";
import { canManageBusiness } from "@/server/permissions/can";
import { businessSettingsSchema } from "@/server/validators/business";
import { updateBusinessSettings } from "@/server/services/business";

export async function updateBusinessSettingsAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageBusiness(session)) {
    redirect("/app/settings/business?error=Permission%20denied");
  }

  const parsed = businessSettingsSchema.safeParse({
    displayName: formData.get("displayName"),
    timezone: formData.get("timezone"),
    currency: formData.get("currency"),
    serviceArea: formData.get("serviceArea") ?? "",
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? "",
    description: formData.get("description") ?? "",
  });

  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? "Invalid input";
    redirect(`/app/settings/business?error=${encodeURIComponent(msg)}`);
  }

  await updateBusinessSettings(session.organizationId, parsed.data);
  revalidatePath("/app/settings/business");
  revalidatePath("/book");
  redirect("/app/settings/business?saved=1");
}
