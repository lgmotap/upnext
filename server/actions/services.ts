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
import { prisma } from "@/lib/db/prisma";
import type { PricingParameterConfig } from "@/lib/pricing/parameters";

function redirectWithError(path: string, error: string): never {
  redirect(`${path}?error=${encodeURIComponent(error)}`);
}

function parsePricingParametersFromForm(formData: FormData): PricingParameterConfig[] {
  if (formData.get("enableBedBathPricing") !== "on") return [];
  if (formData.get("isAddon") === "on") return [];

  const bedroomUnit = Math.round(Number(formData.get("bedroomUnitPrice")) * 100);
  const bathroomUnit = Math.round(Number(formData.get("bathroomUnitPrice")) * 100);
  const bedroomIncluded = Number(formData.get("bedroomIncluded"));
  const bathroomIncluded = Number(formData.get("bathroomIncluded"));

  if (
    !Number.isFinite(bedroomUnit) ||
    !Number.isFinite(bathroomUnit) ||
    !Number.isInteger(bedroomIncluded) ||
    !Number.isInteger(bathroomIncluded)
  ) {
    return [];
  }

  return [
    {
      parameterType: "bedrooms",
      unitPriceCents: Math.max(0, bedroomUnit),
      includedUnits: Math.max(0, bedroomIncluded),
      maxUnits: 10,
    },
    {
      parameterType: "bathrooms",
      unitPriceCents: Math.max(0, bathroomUnit),
      includedUnits: Math.max(0, bathroomIncluded),
      maxUnits: 8,
    },
  ];
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
