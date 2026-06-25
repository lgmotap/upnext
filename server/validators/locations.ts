import { z } from "zod";
import { US_REGIONS } from "@/server/validators/onboarding";

const optionalTrimmed = (max: number) =>
  z.string().max(max).trim().optional().default("");

export const locationFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(120).trim(),
  isDefault: z.preprocess(
    (v) => v === "on" || v === "1" || v === true || v === "true",
    z.boolean().optional().default(false),
  ),
  isActive: z.preprocess(
    (v) => v === "on" || v === "1" || v === true || v === "true" || v === undefined,
    z.boolean().optional().default(true),
  ),
  addressLine1: optionalTrimmed(160),
  addressLine2: optionalTrimmed(80),
  city: optionalTrimmed(80),
  region: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine((v) => !v || (US_REGIONS as readonly string[]).includes(v), {
      message: "Choose a state",
    }),
  postalCode: optionalTrimmed(20),
  country: z.string().min(2).max(2).default("US"),
  phone: optionalTrimmed(40),
  timezone: optionalTrimmed(64),
});

export type LocationFormInput = z.infer<typeof locationFormSchema>;

export const publicLocationIdField = z.string().min(1).optional().or(z.literal(""));
