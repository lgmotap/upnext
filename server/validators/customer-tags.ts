import { z } from "zod";

export function normalizeCustomerTags(raw: string): string[] {
  const tags = raw
    .split(/[,]+/)
    .map((t) => t.trim().toLowerCase().replace(/\s+/g, "-"))
    .filter((t) => t.length > 0 && t.length <= 32);
  return [...new Set(tags)].slice(0, 20);
}

export const customerTagsSchema = z.object({
  customerId: z.string().min(1),
  tags: z.string().max(500),
});
