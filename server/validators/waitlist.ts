import { z } from "zod";

function requiredSelection(label: string) {
  return z.string().trim().min(1, `${label} is required.`).max(100);
}

export const waitlistLeadSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(80),
  email: z.string().trim().email("Enter a valid email.").max(320),
  businessName: z.string().trim().min(1, "Business name is required.").max(200),
  businessType: requiredSelection("Service type"),
  businessSize: requiredSelection("Team size"),
  currentTool: requiredSelection("Current tool"),
  source: z.string().trim().max(200).optional().default("/"),
});

export type WaitlistLeadInput = z.infer<typeof waitlistLeadSchema>;
