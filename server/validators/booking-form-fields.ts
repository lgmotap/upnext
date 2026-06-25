import type { BookingFormField } from "@/generated/prisma/client";
import { z } from "zod";

export const bookingFormFieldTypes = ["text", "textarea", "select", "checkbox"] as const;

export const bookingFormFieldSchema = z.object({
  label: z.string().trim().min(1).max(120),
  fieldType: z.enum(bookingFormFieldTypes),
  options: z.array(z.string().trim().min(1)).max(20).optional(),
  required: z.coerce.boolean(),
});

export function slugifyFieldKey(label: string): string {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return base || "field";
}

export function buildCustomFieldsValidator(fields: BookingFormField[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    let schema: z.ZodTypeAny;
    switch (field.fieldType) {
      case "checkbox":
        schema = z.union([z.literal("on"), z.literal("true"), z.literal("1"), z.literal("")]).transform(
          (v) => v === "on" || v === "true" || v === "1",
        );
        break;
      case "textarea":
        schema = z.string().trim().max(2000);
        break;
      default:
        schema = z.string().trim().max(500);
        break;
    }
    shape[field.key] = field.required ? schema : schema.optional().or(z.literal(""));
  }
  return z.object(shape);
}

export function parseCustomFieldsFromForm(
  fields: BookingFormField[],
  formData: FormData,
): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (const field of fields) {
    const raw = formData.get(`custom_${field.key}`);
    if (field.fieldType === "checkbox") {
      out[field.key] = raw === "on" || raw === "true" || raw === "1";
    } else {
      out[field.key] = String(raw ?? "").trim();
    }
  }
  return out;
}
