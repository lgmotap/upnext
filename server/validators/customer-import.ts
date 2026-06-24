import { z } from "zod";

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === "" ? undefined : v));

export const customerImportRowSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required").max(80),
    lastName: z.string().trim().min(1, "Last name is required").max(80),
    email: z.string().trim().email("Invalid email").max(200),
    phone: optionalTrimmed(30),
    line1: optionalTrimmed(200),
    line2: optionalTrimmed(200),
    city: optionalTrimmed(100),
    region: optionalTrimmed(100),
    postalCode: optionalTrimmed(20),
    country: optionalTrimmed(2).transform((v) => v ?? "US"),
  })
  .superRefine((data, ctx) => {
    const hasAddress =
      Boolean(data.line1) ||
      Boolean(data.city) ||
      Boolean(data.region) ||
      Boolean(data.postalCode);
    if (!hasAddress) return;

    if (!data.line1) {
      ctx.addIssue({ code: "custom", message: "line1 is required when address is provided", path: ["line1"] });
    }
    if (!data.city) {
      ctx.addIssue({ code: "custom", message: "city is required when address is provided", path: ["city"] });
    }
    if (!data.region) {
      ctx.addIssue({ code: "custom", message: "region is required when address is provided", path: ["region"] });
    }
    if (!data.postalCode) {
      ctx.addIssue({
        code: "custom",
        message: "postalCode is required when address is provided",
        path: ["postalCode"],
      });
    }
  });

export type CustomerImportRow = z.infer<typeof customerImportRowSchema>;

export const CUSTOMER_IMPORT_MAX_ROWS = 500;
