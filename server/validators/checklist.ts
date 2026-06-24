import { z } from "zod";

export const checklistLabelsSchema = z
  .array(z.string().trim().min(1, "Item cannot be empty").max(200))
  .max(20, "Maximum 20 checklist items");

export function parseChecklistLines(raw: string): string[] {
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const parsed = checklistLabelsSchema.safeParse(lines);
  return parsed.success ? parsed.data : lines.slice(0, 20);
}

export const toggleChecklistItemSchema = z.object({
  jobId: z.string().min(1),
  itemId: z.string().min(1),
  completed: z.enum(["true", "false"]),
});
