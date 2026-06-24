import { z } from "zod";
import { serviceTypes, teamSizes } from "@/lib/config";

/** Currencies offered in onboarding (extend as we expand regions). */
export const CURRENCIES = ["USD", "CAD", "EUR", "GBP", "AUD"] as const;

/** A small curated timezone list for the MVP onboarding select. */
export const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "Europe/London",
  "Europe/Madrid",
  "Australia/Sydney",
] as const;

export const US_REGIONS = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  "DC",
] as const;

const optionalTrimmed = (max: number) =>
  z.string().max(max).trim().optional().default("");

export const businessSetupSchema = z.object({
  businessType: z.enum(serviceTypes, { message: "Choose your service type" }),
  teamSize: z.enum(teamSizes, { message: "Choose your team size" }),
  addressLine1: z.string().min(1, "Street address is required").max(160).trim(),
  addressLine2: optionalTrimmed(80),
  city: z.string().min(1, "City is required").max(80).trim(),
  region: z.string().min(1, "State / region is required").max(40).trim(),
  postalCode: z.string().min(1, "ZIP / postal code is required").max(20).trim(),
  country: z.string().min(2).max(2).default("US"),
  displayName: z.string().min(1, "Business name is required").max(120).trim(),
  timezone: z.enum(TIMEZONES, { message: "Choose a timezone" }),
  currency: z.enum(CURRENCIES, { message: "Choose a currency" }),
  serviceArea: z.string().max(160).trim().optional().default(""),
  phone: z.string().max(40).trim().optional().default(""),
  description: z.string().max(400).trim().optional().default(""),
  seedServiceName: z.string().max(120).trim().optional(),
  seedServicePriceDollars: z.coerce.number().min(0).max(99999).optional(),
  seedServiceDurationMinutes: z.coerce.number().int().min(15).max(480).optional(),
});

export type BusinessSetupInput = z.infer<typeof businessSetupSchema>;
