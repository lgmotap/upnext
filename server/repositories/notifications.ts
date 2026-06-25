import { prisma } from "@/lib/db/prisma";
import type {
  NotificationChannel,
  NotificationRecipientType,
  NotificationStatus,
  NotificationTemplate,
} from "@/generated/prisma/client";

export function createNotificationLog(data: {
  organizationId: string;
  recipientType: NotificationRecipientType;
  recipientEmail: string;
  channel?: NotificationChannel;
  template: NotificationTemplate;
  status: NotificationStatus;
  relatedType: string;
  relatedId: string;
  resendEmailId?: string | null;
  error?: string | null;
}) {
  return prisma.notificationLog.create({
    data: {
      ...data,
      channel: data.channel ?? "email",
    },
  });
}

export function wasNotificationSent(params: {
  organizationId: string;
  template: NotificationTemplate;
  relatedId: string;
  recipientEmail: string;
  channel?: NotificationChannel;
}) {
  return prisma.notificationLog.findFirst({
    where: {
      organizationId: params.organizationId,
      template: params.template,
      relatedId: params.relatedId,
      recipientEmail: params.recipientEmail,
      ...(params.channel ? { channel: params.channel } : {}),
      status: "sent",
    },
  });
}

export function countNotificationLogsForOrg(
  organizationId: string,
  options?: { channel?: NotificationChannel; customerId?: string; customerEmail?: string; relatedIds?: string[] },
) {
  return prisma.notificationLog.count({
    where: notificationLogWhere(organizationId, options),
  });
}

function notificationLogWhere(
  organizationId: string,
  options?: { channel?: NotificationChannel; customerId?: string; customerEmail?: string; relatedIds?: string[] },
) {
  const relatedIds = options?.relatedIds ?? [];
  const customerClauses =
    options?.customerId || options?.customerEmail
      ? [
          ...(options.customerId
            ? [{ relatedType: "customer" as const, relatedId: options.customerId }]
            : []),
          ...(options.customerEmail
            ? [{ recipientEmail: options.customerEmail }]
            : []),
          ...(relatedIds.length > 0 ? [{ relatedId: { in: relatedIds } }] : []),
        ]
      : [];

  return {
    organizationId,
    ...(options?.channel ? { channel: options.channel } : {}),
    ...(customerClauses.length > 0 ? { OR: customerClauses } : {}),
  };
}

export function listNotificationLogsForOrg(
  organizationId: string,
  options?: {
    limit?: number;
    page?: number;
    pageSize?: number;
    channel?: NotificationChannel;
    customerId?: string;
    customerEmail?: string;
    relatedIds?: string[];
  },
) {
  const pageSize = options?.pageSize ?? options?.limit ?? 50;
  const page = Math.max(1, options?.page ?? 1);
  const skip = options?.page ? (page - 1) * pageSize : 0;

  return prisma.notificationLog.findMany({
    where: notificationLogWhere(organizationId, options),
    orderBy: { sentAt: "desc" },
    skip,
    take: pageSize,
  });
}
