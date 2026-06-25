import { z } from "zod";
import {
  parseZipCodesInput,
  SERVICE_AREA_ENFORCEMENT_MODES,
  type ServiceAreaEnforcementMode,
} from "@/lib/business/service-area-enforcement";

const optionalTrimmed = (max: number) =>
  z.string().max(max).trim().optional().default("");

export const serviceAreaEnforcementModeField = z.enum(SERVICE_AREA_ENFORCEMENT_MODES);
export const serviceAreaZipCodesRawField = optionalTrimmed(8000);
export const serviceAreaRadiusMilesField = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
  z.number().int().min(1).max(100).optional(),
);

export function refineServiceAreaEnforcementFields(
  data: {
    serviceAreaEnforcementMode: string;
    serviceAreaZipCodesRaw?: string;
    serviceAreaRadiusMiles?: number;
    addressLatitude?: number;
    addressLongitude?: number;
  },
  ctx: z.RefinementCtx,
) {
  const mode = data.serviceAreaEnforcementMode as ServiceAreaEnforcementMode;
  if (mode === "zip_list") {
    const zips = parseZipCodesInput(String(data.serviceAreaZipCodesRaw ?? ""));
    if (zips.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter at least one valid US ZIP code",
        path: ["serviceAreaZipCodesRaw"],
      });
    }
  }
  if (mode === "radius") {
    if (!data.serviceAreaRadiusMiles) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a radius between 1 and 100 miles",
        path: ["serviceAreaRadiusMiles"],
      });
    }
    if (data.addressLatitude == null || data.addressLongitude == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Radius mode requires business coordinates — re-save your address using Google Places autocomplete",
        path: ["serviceAreaEnforcementMode"],
      });
    }
  }
}

export function computeServiceAreaZipCodesJson(
  mode: ServiceAreaEnforcementMode,
  raw: string | undefined,
): string[] | null {
  if (mode !== "zip_list") return null;
  return parseZipCodesInput(String(raw ?? ""));
}
