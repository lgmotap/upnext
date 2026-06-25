import { z } from "zod";
import {
  formatServiceAreaDisplay,
  SERVICE_AREA_SCOPES,
  type ServiceAreaScope,
} from "@/lib/business/service-area";

const optionalTrimmed = (max: number) =>
  z.string().max(max).trim().optional().default("");

export const serviceAreaScopeField = z.enum(SERVICE_AREA_SCOPES);
export const serviceAreaCustomField = optionalTrimmed(160);

export function refineServiceAreaFields(
  data: {
    city: string;
    region: string;
    serviceAreaScope: string;
    serviceAreaCustom?: string;
  },
  ctx: z.RefinementCtx,
) {
  if (data.serviceAreaScope === "custom" && !String(data.serviceAreaCustom ?? "").trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Enter a custom service area label",
      path: ["serviceAreaCustom"],
    });
  }
  const display = formatServiceAreaDisplay(
    data.city,
    data.region,
    data.serviceAreaScope as ServiceAreaScope,
    data.serviceAreaCustom,
  );
  if (!display.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Set your service area using city, state, or a custom label",
      path: ["serviceAreaScope"],
    });
  }
}

export function computeServiceAreaDisplay(data: {
  city: string;
  region: string;
  serviceAreaScope: ServiceAreaScope;
  serviceAreaCustom?: string;
}): string {
  return formatServiceAreaDisplay(
    data.city,
    data.region,
    data.serviceAreaScope,
    data.serviceAreaCustom,
  );
}
