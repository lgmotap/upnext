"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppSession } from "@/server/permissions/session";
import { canManageBusiness } from "@/server/permissions/can";
import { removeBusinessLogo, uploadBusinessLogo } from "@/server/services/business-logo";

export async function uploadBusinessLogoAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageBusiness(session)) {
    redirect("/app/settings/business?error=Permission%20denied");
  }

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/app/settings/business?error=Choose%20an%20image%20to%20upload");
  }

  const result = await uploadBusinessLogo(session.organizationId, file);
  if (!result.ok) {
    redirect(`/app/settings/business?error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/app/settings/business");
  revalidatePath("/book");
  redirect("/app/settings/business?saved=logo");
}

export async function removeBusinessLogoAction(): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageBusiness(session)) {
    redirect("/app/settings/business?error=Permission%20denied");
  }

  await removeBusinessLogo(session.organizationId);
  revalidatePath("/app/settings/business");
  revalidatePath("/book");
  redirect("/app/settings/business?saved=logo_removed");
}
