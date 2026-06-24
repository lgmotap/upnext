import { z } from "zod";
import { businessSetupSchema } from "@/server/validators/onboarding";

export const businessSettingsSchema = businessSetupSchema.extend({
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
});

export type BusinessSettingsInput = z.infer<typeof businessSettingsSchema>;
