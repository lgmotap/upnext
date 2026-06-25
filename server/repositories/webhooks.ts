import { prisma } from "@/lib/db/prisma";
import type { WebhookEventType } from "@/generated/prisma/client";

export const WEBHOOK_EVENT_LABELS: Record<WebhookEventType, string> = {
  booking_created: "Booking created",
  booking_accepted: "Booking accepted",
  booking_canceled: "Booking canceled",
  job_completed: "Job completed",
  customer_created: "Customer created",
  payment_paid: "Payment paid",
};

export const ALL_WEBHOOK_EVENTS = Object.keys(WEBHOOK_EVENT_LABELS) as WebhookEventType[];

export function listWebhookEndpoints(organizationId: string) {
  return prisma.webhookEndpoint.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      url: true,
      events: true,
      isActive: true,
      createdAt: true,
      _count: { select: { deliveries: true } },
    },
  });
}

export function listWebhookDeliveries(organizationId: string, limit = 20) {
  return prisma.webhookDelivery.findMany({
    where: { webhookEndpoint: { organizationId } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      event: true,
      status: true,
      attemptCount: true,
      lastError: true,
      responseStatus: true,
      createdAt: true,
      deliveredAt: true,
      webhookEndpoint: { select: { url: true } },
    },
  });
}

export function createWebhookEndpoint(
  organizationId: string,
  data: { url: string; secret: string; events: WebhookEventType[] },
) {
  return prisma.webhookEndpoint.create({
    data: {
      organizationId,
      url: data.url,
      secret: data.secret,
      events: data.events,
    },
  });
}

export function deactivateWebhookEndpoint(organizationId: string, endpointId: string) {
  return prisma.webhookEndpoint.updateMany({
    where: { id: endpointId, organizationId },
    data: { isActive: false },
  });
}

export function listActiveEndpointsForEvent(organizationId: string, event: WebhookEventType) {
  return prisma.webhookEndpoint.findMany({
    where: {
      organizationId,
      isActive: true,
      events: { has: event },
    },
  });
}

export function createWebhookDelivery(
  webhookEndpointId: string,
  event: WebhookEventType,
  payload: object,
) {
  return prisma.webhookDelivery.create({
    data: {
      webhookEndpointId,
      event,
      payload: payload as object,
    },
  });
}

export function updateWebhookDelivery(
  id: string,
  data: {
    status: "delivered" | "failed" | "pending";
    attemptCount: number;
    lastError?: string | null;
    responseStatus?: number | null;
    deliveredAt?: Date | null;
  },
) {
  return prisma.webhookDelivery.update({
    where: { id },
    data,
  });
}

export function listPendingWebhookDeliveries(limit = 50) {
  return prisma.webhookDelivery.findMany({
    where: {
      status: { in: ["pending", "failed"] },
      attemptCount: { lt: 3 },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
    include: { webhookEndpoint: true },
  });
}
