import { z } from "zod";

export const inviteTeamMemberSchema = z.object({
  email: z.string().email("Enter a valid email").transform((v) => v.trim().toLowerCase()),
  role: z.enum(["worker", "dispatcher"]).default("worker"),
});

export const inviteSignUpSchema = z.object({
  name: z.string().min(1, "Your name is required").max(120).trim(),
  email: z.string().email("Enter a valid email").transform((v) => v.trim().toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters"),
  inviteToken: z.string().min(1),
});
