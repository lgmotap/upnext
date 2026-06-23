import { z } from "zod";

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

export const businessSetupSchema = z.object({
  displayName: z.string().min(1, "Business name is required").max(120).trim(),
  timezone: z.enum(TIMEZONES, { message: "Choose a timezone" }),
  currency: z.enum(CURRENCIES, { message: "Choose a currency" }),
  serviceArea: z.string().max(160).trim().optional().default(""),
  phone: z.string().max(40).trim().optional().default(""),
  description: z.string().max(400).trim().optional().default(""),
});

export type BusinessSetupInput = z.infer<typeof businessSetupSchema>;
