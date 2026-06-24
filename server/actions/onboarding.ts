"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAppSession } from "@/server/permissions/session";
import { canManageBusiness } from "@/server/permissions/can";
import { businessSetupSchema } from "@/server/validators/onboarding";
import { updateBusinessSetup } from "@/server/services/business";
import { seedIndustryCatalogIfEmpty } from "@/server/services/industry-catalog";
import { prisma } from "@/lib/db/prisma";
import { ONBOARDING_COOKIE } from "@/lib/onboarding/constants";

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
    businessType: formData.get("businessType"),
    teamSize: formData.get("teamSize"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2") ?? "",
    city: formData.get("city"),
    region: formData.get("region"),
    postalCode: formData.get("postalCode"),
    country: formData.get("country") ?? "US",
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

  const data = parsed.data;
  const org = await prisma.organization.findUnique({
    where: { id: session.organizationId },
    select: { currency: true },
  });
  if (!org) onboardingRedirect({ error: "Workspace not found." });

  await updateBusinessSetup(session.organizationId, data);

  const seed = await seedIndustryCatalogIfEmpty(
    session.organizationId,
    org.currency,
    data.businessType,
  );
  void seed;

  const jar = await cookies();
  jar.set(ONBOARDING_COOKIE, session.organizationId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect("/app/dashboard?welcome=1");
}
