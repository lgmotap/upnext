import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

function parseAddonIds(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  const s = String(value).trim();
  if (!s) return [];
  return s.split(",").map((id) => id.trim()).filter(Boolean);
}

function optionalIntParam(max: number) {
  return z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
    z.number().int().min(0).max(max).optional(),
  );
}

export const publicBookingSchema = z.object({
  businessSlug: z.string().min(1).max(80),
  serviceId: z.string().min(1),
  addonServiceIds: z.preprocess(parseAddonIds, z.array(z.string().min(1)).max(10)),
  date: z.string().regex(dateRegex, "Invalid date"),
  time: z.string().regex(timeRegex, "Invalid time"),
  firstName: z.string().min(1).max(80).trim(),
  lastName: z.string().min(1).max(80).trim(),
  email: z.string().email().max(200).trim().toLowerCase(),
  phone: z.string().max(30).trim().optional().or(z.literal("")),
  line1: z.string().min(1).max(200).trim(),
  line2: z.string().max(200).trim().optional().or(z.literal("")),
  city: z.string().min(1).max(100).trim(),
  region: z.string().min(1).max(100).trim(),
  postalCode: z.string().min(1).max(20).trim(),
  locationId: z.string().optional().or(z.literal("")),
  customerNotes: z.string().max(2000).trim().optional().or(z.literal("")),
  frequency: z.enum(["one_time", "weekly", "biweekly", "monthly"]).default("one_time"),
  bedrooms: optionalIntParam(10),
  bathrooms: optionalIntParam(8),
  half_bathrooms: optionalIntParam(6),
  square_feet: optionalIntParam(10000),
  customFieldsJson: z.record(z.string(), z.union([z.string(), z.boolean()])).optional(),
});

export type PublicBookingInput = z.input<typeof publicBookingSchema>;

export const manualBookingSchema = z
  .object({
    serviceId: z.string().min(1),
    addonServiceIds: z.preprocess(parseAddonIds, z.array(z.string().min(1)).max(10)),
    date: z.string().regex(dateRegex, "Invalid date"),
    time: z.string().regex(timeRegex, "Invalid time"),
    customerId: z.string().optional().or(z.literal("")),
    firstName: z.string().max(80).trim().optional().or(z.literal("")),
    lastName: z.string().max(80).trim().optional().or(z.literal("")),
    email: z.string().max(200).trim().optional().or(z.literal("")),
    phone: z.string().max(30).trim().optional().or(z.literal("")),
    line1: z.string().max(200).trim().optional().or(z.literal("")),
    line2: z.string().max(200).trim().optional().or(z.literal("")),
    city: z.string().max(100).trim().optional().or(z.literal("")),
    region: z.string().max(100).trim().optional().or(z.literal("")),
    postalCode: z.string().max(20).trim().optional().or(z.literal("")),
    customerNotes: z.string().max(2000).trim().optional().or(z.literal("")),
    assignMembershipId: z.string().optional().or(z.literal("")),
    frequency: z.enum(["one_time", "weekly", "biweekly", "monthly"]).default("one_time"),
    bedrooms: optionalIntParam(10),
    bathrooms: optionalIntParam(8),
    half_bathrooms: optionalIntParam(6),
    square_feet: optionalIntParam(10000),
    collectPaymentNow: z.preprocess(
      (v) => v === "on" || v === true || v === "true" || v === "collect_now",
      z.boolean().optional(),
    ),
    customerAddressId: z.string().optional().or(z.literal("")),
    locationId: z.string().optional().or(z.literal("")),
    overrideServiceArea: z.preprocess(
      (v) => v === "on" || v === "1" || v === true || v === "true",
      z.boolean().optional().default(false),
    ),
    customFieldsJson: z.record(z.string(), z.union([z.string(), z.boolean()])).optional(),
  })
  .superRefine((data, ctx) => {
    const hasExisting = Boolean(data.customerId?.trim());
    if (hasExisting) return;

    const required: Array<keyof typeof data> = [
      "firstName",
      "lastName",
      "email",
      "line1",
      "city",
      "region",
      "postalCode",
    ];
    for (const field of required) {
      const value = data[field];
      if (!value || (typeof value === "string" && !value.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Required for new customers",
          path: [field],
        });
      }
    }
    if (data.email && !z.string().email().safeParse(data.email.trim().toLowerCase()).success) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid email", path: ["email"] });
    }
  });

export type ManualBookingInput = z.input<typeof manualBookingSchema>;
