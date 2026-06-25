"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppSession } from "@/server/permissions/session";
import { canManageBusiness } from "@/server/permissions/can";
import { updatePortalSettings } from "@/server/repositories/customer-portal";
import { ensurePortalFaqDefaults } from "@/server/services/portal-faq";
import { parsePortalFaqFormData, portalSettingsSchema } from "@/server/validators/customer-portal";

export async function updatePortalSettingsAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageBusiness(session)) {
    redirect("/app/settings/portals?error=Permission%20denied");
  }

  const parsed = portalSettingsSchema.safeParse({
    customerPortalEnabled: formData.get("customerPortalEnabled") === "on" ? "on" : "",
    portalPasswordLoginEnabled:
      formData.get("portalPasswordLoginEnabled") === "on" ? "on" : "",
  });
  if (!parsed.success) {
    redirect("/app/settings/portals?error=Invalid%20settings");
  }

  const faq = parsePortalFaqFormData(formData);
  if (faq === null) {
    redirect("/app/settings/portals?error=Invalid%20FAQ%20data");
  }

  await updatePortalSettings(session.organizationId, {
    customerPortalEnabled: parsed.data.customerPortalEnabled,
    portalPasswordLoginEnabled: parsed.data.portalPasswordLoginEnabled ?? false,
    portalFaqJson: faq,
  });

  if (faq.length === 0) {
    await ensurePortalFaqDefaults(session.organizationId);
  }

  revalidatePath("/app/settings/portals");
  revalidatePath("/my");
  redirect("/app/settings/portals?saved=1");
}
