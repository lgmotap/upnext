import { z } from "zod";
import { MAX_PORTAL_FAQ_ITEMS } from "@/lib/portal/faq";

export const portalEmailSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export const portalPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export const portalFaqItemSchema = z.object({
  question: z.string().trim().min(1).max(200),
  answer: z.string().trim().min(1).max(2000),
});

export const portalFaqSchema = z
  .array(portalFaqItemSchema)
  .max(MAX_PORTAL_FAQ_ITEMS, `Maximum ${MAX_PORTAL_FAQ_ITEMS} FAQ items`);

export const portalSettingsSchema = z.object({
  customerPortalEnabled: z
    .union([z.literal("on"), z.literal("true"), z.literal("1"), z.literal("")])
    .transform((v) => v === "on" || v === "true" || v === "1"),
  portalPasswordLoginEnabled: z
    .union([z.literal("on"), z.literal("true"), z.literal("1"), z.literal("")])
    .optional()
    .transform((v) => v === "on" || v === "true" || v === "1"),
});

export function parsePortalFaqFormData(formData: FormData) {
  const raw = formData.get("portalFaqJson");
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return portalFaqSchema.parse(parsed);
  } catch {
    return null;
  }
}
