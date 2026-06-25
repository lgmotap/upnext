"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppSession } from "@/server/permissions/session";
import { canManageServices } from "@/server/permissions/can";
import { serviceInputSchema } from "@/server/validators/service";
import {
  createService,
  deleteService,
  toggleServiceActive,
  updateService,
} from "@/server/services/services";
import { replaceChecklistTemplateForService } from "@/server/services/checklists";
import { seedIndustryCatalog } from "@/server/services/industry-catalog";
import { replaceServicePricingParameters } from "@/server/repositories/pricing-parameters";
import { replaceServiceFrequencyDiscounts } from "@/server/repositories/frequency-discounts";
import type { FrequencyDiscountConfig } from "@/lib/pricing/frequency-discount";
import type { BookingFrequency } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { PricingParameterConfig } from "@/lib/pricing/parameters";
import { PRICING_PARAMETER_LIMITS } from "@/lib/pricing/parameters";
import type { PricingParameterType } from "@/generated/prisma/client";

function redirectWithError(path: string, error: string): never {
  redirect(`${path}?error=${encodeURIComponent(error)}`);
}

const PRICING_FORM_FIELDS: Record<PricingParameterType, { unit: string; included: string }> = {
  bedrooms: { unit: "bedroomUnitPrice", included: "bedroomIncluded" },
  bathrooms: { unit: "bathroomUnitPrice", included: "bathroomIncluded" },
  half_bathrooms: { unit: "halfBathUnitPrice", included: "halfBathIncluded" },
  square_feet: { unit: "sqFtUnitPrice", included: "sqFtIncluded" },
};

function parsePricingParametersFromForm(formData: FormData): PricingParameterConfig[] {
  const enabled =
    formData.get("enablePricingParameters") === "on" || formData.get("enableBedBathPricing") === "on";
  if (!enabled) return [];
  if (formData.get("isAddon") === "on") return [];

  const configs: PricingParameterConfig[] = [];

  for (const parameterType of Object.keys(PRICING_FORM_FIELDS) as PricingParameterType[]) {
    const fields = PRICING_FORM_FIELDS[parameterType];
    const limits = PRICING_PARAMETER_LIMITS[parameterType];
    const unitDollars = Number(formData.get(fields.unit));
    const included = Number(formData.get(fields.included));

    if (!Number.isFinite(unitDollars) || !Number.isInteger(included)) {
      continue;
    }

    configs.push({
      parameterType,
      unitPriceCents: Math.max(0, Math.round(unitDollars * 100)),
      includedUnits: Math.max(0, Math.min(included, limits.maxUnits)),
      maxUnits: limits.maxUnits,
    });
  }

  return configs;
}

function parseFrequencyDiscountsFromForm(formData: FormData): FrequencyDiscountConfig[] {
  const frequencies: BookingFrequency[] = ["weekly", "biweekly", "monthly"];
  return frequencies
    .map((frequency) => {
      const percentOff = Number(formData.get(`freqDiscountPercent_${frequency}`));
      return {
        frequency,
        percentOff: Number.isFinite(percentOff) ? Math.min(100, Math.max(0, Math.round(percentOff))) : 0,
        amountOffCents: 0,
      };
    })
    .filter((r) => r.percentOff > 0);
}

export async function createServiceAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageServices(session)) redirectWithError("/app/services", "Permission denied");

  const org = await prisma.organization.findUnique({ where: { id: session.organizationId } });
  if (!org) redirectWithError("/app/services", "Organization not found");

  const priceDollars = formData.get("priceDollars");
  const parsed = serviceInputSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    durationMinutes: formData.get("durationMinutes"),
    basePriceCents: Math.round(Number(priceDollars) * 100),
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
    isPublic: formData.get("isPublic") === "on" || formData.get("isPublic") === "true",
    isAddon: formData.get("isAddon") === "on" || formData.get("isAddon") === "true",
  });

  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? "Invalid input";
    redirectWithError("/app/services", msg);
  }

  const created = await createService(session.organizationId, org.currency, parsed.data);
  await replaceChecklistTemplateForService(
    session.organizationId,
    created.id,
    String(formData.get("checklistItems") ?? ""),
  );
  if (!parsed.data.isAddon) {
    await replaceServicePricingParameters(created.id, parsePricingParametersFromForm(formData));
    await replaceServiceFrequencyDiscounts(created.id, parseFrequencyDiscountsFromForm(formData));
  }
  revalidatePath("/app/services");
  revalidatePath("/book");
  redirect("/app/services");
}

export async function updateServiceAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageServices(session)) redirectWithError("/app/services", "Permission denied");

  const serviceId = String(formData.get("serviceId") ?? "");
  const priceDollars = formData.get("priceDollars");

  const parsed = serviceInputSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    durationMinutes: formData.get("durationMinutes"),
    basePriceCents: Math.round(Number(priceDollars) * 100),
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
    isPublic: formData.get("isPublic") === "on" || formData.get("isPublic") === "true",
    isAddon: formData.get("isAddon") === "on" || formData.get("isAddon") === "true",
  });

  if (!parsed.success || !serviceId) {
    redirectWithError("/app/services", "Invalid input");
  }

  const updated = await updateService(session.organizationId, serviceId, parsed.data);
  if (!updated) redirectWithError("/app/services", "Service not found");

  await replaceChecklistTemplateForService(
    session.organizationId,
    serviceId,
    String(formData.get("checklistItems") ?? ""),
  );
  if (!parsed.data.isAddon) {
    await replaceServicePricingParameters(serviceId, parsePricingParametersFromForm(formData));
    await replaceServiceFrequencyDiscounts(serviceId, parseFrequencyDiscountsFromForm(formData));
  }

  revalidatePath("/app/services");
  revalidatePath("/book");
  redirect("/app/services");
}

export async function toggleServiceAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageServices(session)) return;

  const serviceId = String(formData.get("serviceId") ?? "");
  if (!serviceId) return;

  await toggleServiceActive(session.organizationId, serviceId);
  revalidatePath("/app/services");
  revalidatePath("/book");
}

export async function deleteServiceAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageServices(session)) return;

  const serviceId = String(formData.get("serviceId") ?? "");
  if (!serviceId) return;

  await deleteService(session.organizationId, serviceId);
  revalidatePath("/app/services");
  revalidatePath("/book");
}

export async function seedSuggestedCatalogAction(): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageServices(session)) {
    redirect("/app/services?error=Permission%20denied");
  }

  const org = await prisma.organization.findUnique({
    where: { id: session.organizationId },
    include: { businessProfile: { select: { businessType: true } } },
  });
  const businessType = org?.businessProfile?.businessType;
  if (!org || !businessType) {
    redirect("/app/services?error=Set%20your%20business%20type%20in%20Settings%20first");
  }

  const result = await seedIndustryCatalog(session.organizationId, org.currency, businessType);
  if (!result.seeded) {
    redirect("/app/services?error=All%20suggested%20services%20are%20already%20on%20your%20list");
  }

  revalidatePath("/app/services");
  revalidatePath("/book");
  redirect(`/app/services?seeded=${result.primaryCount + result.addonCount}`);
}
