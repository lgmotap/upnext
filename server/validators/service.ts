import { z } from "zod";

export const serviceInputSchema = z.object({
  name: z.string().min(1, "Name is required").max(120).trim(),
  description: z.string().max(2000).trim().optional().or(z.literal("")),
  durationMinutes: z.coerce.number().int().min(15, "Minimum 15 minutes").max(480),
  basePriceCents: z.coerce.number().int().min(0),
  isActive: z.coerce.boolean().optional().default(true),
  isPublic: z.coerce.boolean().optional().default(true),
  isAddon: z.coerce.boolean().optional().default(false),
});

export const serviceUpdateSchema = serviceInputSchema.partial().extend({
  id: z.string().min(1),
});

export type ServiceInput = z.infer<typeof serviceInputSchema>;
