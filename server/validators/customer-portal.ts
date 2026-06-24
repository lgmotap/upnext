import { z } from "zod";

export const portalEmailSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export const portalSettingsSchema = z.object({
  customerPortalEnabled: z
    .union([z.literal("on"), z.literal("true"), z.literal("1"), z.literal("")])
    .transform((v) => v === "on" || v === "true" || v === "1"),
});
