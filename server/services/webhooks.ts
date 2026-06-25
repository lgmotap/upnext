import { createHmac } from "node:crypto";
import type { WebhookEventType } from "@/generated/prisma/client";
import {
  createWebhookDelivery,
  listActiveEndpointsForEvent,
  listPendingWebhookDeliveries,
  updateWebhookDelivery,
} from "@/server/repositories/webhooks";

const MAX_ATTEMPTS = 3;

function signPayload(secret: string, timestamp: number, body: string): string {
  const signed = `${timestamp}.${body}`;
  return createHmac("sha256", secret).update(signed).digest("hex");
}

export async function deliverWebhookAttempt(
  endpoint: { id: string; url: string; secret: string },
  deliveryId: string,
  event: WebhookEventType,
  payload: object,
  attemptCount: number,
): Promise<void> {
  const body = JSON.stringify({
    id: deliveryId,
    event,
    created_at: new Date().toISOString(),
    data: payload,
  });
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signPayload(endpoint.secret, timestamp, body);

  try {
    const res = await fetch(endpoint.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "BookedFox-Webhooks/1.0",
        "BookedFox-Signature": `t=${timestamp},v1=${signature}`,
      },
      body,
      signal: AbortSignal.timeout(15_000),
    });

    if (res.ok) {
      await updateWebhookDelivery(deliveryId, {
        status: "delivered",
        attemptCount,
        responseStatus: res.status,
        deliveredAt: new Date(),
        lastError: null,
      });
      return;
    }

    const errText = `HTTP ${res.status}`;
    await updateWebhookDelivery(deliveryId, {
      status: attemptCount >= MAX_ATTEMPTS ? "failed" : "pending",
      attemptCount,
      responseStatus: res.status,
      lastError: errText,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delivery failed";
    await updateWebhookDelivery(deliveryId, {
      status: attemptCount >= MAX_ATTEMPTS ? "failed" : "pending",
      attemptCount,
      lastError: message,
    });
  }
}

async function enqueueDelivery(
  endpoint: { id: string; url: string; secret: string },
  event: WebhookEventType,
  payload: object,
) {
  const delivery = await createWebhookDelivery(endpoint.id, event, payload);
  void deliverWebhookAttempt(endpoint, delivery.id, event, payload, 1);
}

/** Fire-and-forget outbound webhook for org subscribers. */
export function emitOrgWebhook(
  organizationId: string,
  event: WebhookEventType,
  payload: object,
): void {
  void (async () => {
    try {
      const endpoints = await listActiveEndpointsForEvent(organizationId, event);
      await Promise.all(endpoints.map((ep) => enqueueDelivery(ep, event, payload)));
    } catch (err) {
      console.error("[webhook emit]", event, err);
    }
  })();
}

export async function retryPendingWebhookDeliveries(): Promise<number> {
  const pending = await listPendingWebhookDeliveries();
  for (const row of pending) {
    if (!row.webhookEndpoint.isActive) continue;
    const nextAttempt = row.attemptCount + 1;
    await deliverWebhookAttempt(
      row.webhookEndpoint,
      row.id,
      row.event,
      row.payload as object,
      nextAttempt,
    );
  }
  return pending.length;
}
