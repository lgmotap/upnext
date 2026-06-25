import { z } from "zod";

export const waitlistLeadSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(80),
  email: z.string().trim().email("Enter a valid email.").max(320),
  businessName: z.string().trim().min(1, "Business name is required.").max(200),
  businessType: z.string().trim().max(100).optional().default(""),
  businessSize: z.string().trim().max(100).optional().default(""),
  currentTool: z.string().trim().max(100).optional().default(""),
  source: z.string().trim().max(200).optional().default("/"),
});

export type WaitlistLeadInput = z.infer<typeof waitlistLeadSchema>;
