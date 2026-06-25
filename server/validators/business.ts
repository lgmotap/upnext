import { z } from "zod";
import { serviceTypes, teamSizes } from "@/lib/config";
import type { ServiceAreaScope } from "@/lib/business/service-area";
import {
  computeServiceAreaDisplay,
  refineServiceAreaFields,
  serviceAreaCustomField,
  serviceAreaScopeField,
} from "@/server/validators/service-area-form";
import { CURRENCIES, TIMEZONES, US_REGIONS } from "@/server/validators/onboarding";

const optionalTrimmed = (max: number) =>
  z.string().max(max).trim().optional().default("");

const websiteUrlField = z
  .string()
  .trim()
  .optional()
  .default("")
  .refine(
    (v) => {
      if (!v) return true;
      const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`;
      return z.string().url().safeParse(withScheme).success;
    },
    { message: "Enter a valid website URL" },
  )
  .transform((v) => {
    if (!v) return "";
    if (/^https?:\/\//i.test(v)) return v;
    return `https://${v}`;
  });

const businessProfileFields = {
  businessType: z.enum(serviceTypes, { message: "Choose your service type" }),
  teamSize: z.enum(teamSizes, { message: "Choose your team size" }),
  addressLine1: z.string().min(1, "Street address is required").max(160).trim(),
  addressLine2: optionalTrimmed(80),
  city: z.string().min(1, "City is required").max(80).trim(),
  region: z.enum(US_REGIONS, { message: "Choose a state" }),
  postalCode: z.string().min(1, "ZIP / postal code is required").max(20).trim(),
  country: z.string().min(2).max(2).default("US"),
  displayName: z.string().min(1, "Business name is required").max(120).trim(),
  timezone: z.enum(TIMEZONES, { message: "Choose a timezone" }),
  currency: z.enum(CURRENCIES, { message: "Choose a currency" }),
  serviceAreaScope: serviceAreaScopeField,
  serviceAreaCustom: serviceAreaCustomField,
  phone: optionalTrimmed(40),
  email: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine((v) => v === "" || z.string().email().safeParse(v).success, {
      message: "Enter a valid email",
    }),
  description: optionalTrimmed(400),
  websiteUrl: websiteUrlField,
};

/** Fields editable on Settings → Business (parity with onboarding capture). */
export const businessSettingsSchema = z
  .object(businessProfileFields)
  .superRefine(refineServiceAreaFields)
  .transform((data) => ({
    ...data,
    serviceArea: computeServiceAreaDisplay({
      city: data.city,
      region: data.region,
      serviceAreaScope: data.serviceAreaScope as ServiceAreaScope,
      serviceAreaCustom: data.serviceAreaCustom,
    }),
  }));

export type BusinessSettingsInput = z.infer<typeof businessSettingsSchema>;
