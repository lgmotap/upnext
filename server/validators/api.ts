import { z } from "zod";
import type { WebhookEventType } from "@/generated/prisma/client";
import { ALL_WEBHOOK_EVENTS } from "@/server/repositories/webhooks";

export const createApiKeySchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export const createWebhookSchema = z.object({
  url: z.string().url().max(500),
  events: z
    .array(z.enum(ALL_WEBHOOK_EVENTS as [WebhookEventType, ...WebhookEventType[]]))
    .min(1),
});
