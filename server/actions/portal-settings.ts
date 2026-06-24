"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppSession } from "@/server/permissions/session";
import { canManageBusiness } from "@/server/permissions/can";
import { updateCustomerPortalEnabled } from "@/server/repositories/customer-portal";
import { portalSettingsSchema } from "@/server/validators/customer-portal";

export async function updatePortalSettingsAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageBusiness(session)) {
    redirect("/app/settings/portals?error=Permission%20denied");
  }

  const parsed = portalSettingsSchema.safeParse({
    customerPortalEnabled: formData.get("customerPortalEnabled") === "on" ? "on" : "",
  });
  if (!parsed.success) {
    redirect("/app/settings/portals?error=Invalid%20settings");
  }

  await updateCustomerPortalEnabled(session.organizationId, parsed.data.customerPortalEnabled);
  revalidatePath("/app/settings/portals");
  revalidatePath("/my");
  redirect("/app/settings/portals?saved=1");
}
