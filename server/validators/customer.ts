import { z } from "zod";
import { US_REGIONS } from "@/server/validators/onboarding";

export const customerNotesSchema = z.object({
  customerId: z.string().min(1),
  notes: z.string().max(4000).trim(),
});

export const customerAddressSchema = z.object({
  customerId: z.string().min(1),
  line1: z.string().min(1).max(160).trim(),
  line2: z.string().max(80).trim().optional().or(z.literal("")),
  city: z.string().min(1).max(80).trim(),
  region: z.enum(US_REGIONS),
  postalCode: z.string().min(1).max(20).trim(),
  country: z.string().length(2).default("US"),
  notes: z.string().max(400).trim().optional().or(z.literal("")),
});
