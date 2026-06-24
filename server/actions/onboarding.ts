"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAppSession } from "@/server/permissions/session";
import { canManageBusiness } from "@/server/permissions/can";
import { businessSetupSchema } from "@/server/validators/onboarding";
import { updateBusinessSetup } from "@/server/services/business";
import { createService } from "@/server/services/services";
import { saveWeeklyAvailability } from "@/server/services/availability";
import { defaultWeeklyRules } from "@/server/validators/availability";
import { prisma } from "@/lib/db/prisma";
import { industryServiceTemplate } from "@/lib/onboarding/industry-templates";
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
    seedServiceName: formData.get("seedServiceName") ?? "",
    seedServicePriceDollars: formData.get("seedServicePriceDollars"),
    seedServiceDurationMinutes: formData.get("seedServiceDurationMinutes"),
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

  const seedName = data.seedServiceName?.trim();
  if (seedName) {
    const template = industryServiceTemplate(data.businessType);
    const priceDollars = data.seedServicePriceDollars ?? template.basePriceCents / 100;
    const duration = data.seedServiceDurationMinutes ?? template.durationMinutes;
    const existing = await prisma.service.count({ where: { organizationId: session.organizationId } });
    if (existing === 0) {
      await createService(session.organizationId, org.currency, {
        name: seedName,
        description: template.description,
        durationMinutes: duration,
        basePriceCents: Math.round(priceDollars * 100),
        isActive: true,
        isPublic: true,
        isAddon: false,
      });
      const rules = await prisma.availabilityRule.count({ where: { organizationId: session.organizationId } });
      if (rules === 0) {
        await saveWeeklyAvailability(session.organizationId, { rules: defaultWeeklyRules() });
      }
    }
  }

  const jar = await cookies();
  jar.set(ONBOARDING_COOKIE, session.organizationId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect("/app/dashboard?welcome=1");
}
