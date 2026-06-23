"use server";

import { redirect } from "next/navigation";
import { getAppSession } from "@/server/permissions/session";
import { canManageBusiness } from "@/server/permissions/can";
import { businessSetupSchema } from "@/server/validators/onboarding";
import { updateBusinessSetup } from "@/server/services/business";

function onboardingRedirect(params: Record<string, string>): never {
  const qs = new URLSearchParams(params).toString();
  redirect(qs ? `/app/onboarding?${qs}` : "/app/onboarding");
}

export async function completeOnboardingAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session) redirect("/sign-in?next=/app/onboarding");
  if (!canManageBusiness(session)) {
    redirect("/app/dashboard?error=You%20do%20not%20have%20permission%20to%20edit%20business%20settings");
  }

  const parsed = businessSetupSchema.safeParse({
    displayName: formData.get("displayName"),
    timezone: formData.get("timezone"),
    currency: formData.get("currency"),
    serviceArea: formData.get("serviceArea") ?? "",
    phone: formData.get("phone") ?? "",
    description: formData.get("description") ?? "",
  });

  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? "Please check the form.";
    onboardingRedirect({ error: msg });
  }

  // Tenant isolation: we only ever pass the session's own organizationId.
  await updateBusinessSetup(session.organizationId, parsed.data);

  redirect("/app/dashboard?welcome=1");
}
