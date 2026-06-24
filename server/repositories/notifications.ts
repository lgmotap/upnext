import { prisma } from "@/lib/db/prisma";
import type {
  NotificationRecipientType,
  NotificationStatus,
  NotificationTemplate,
} from "@/generated/prisma/client";

export function createNotificationLog(data: {
  organizationId: string;
  recipientType: NotificationRecipientType;
  recipientEmail: string;
  template: NotificationTemplate;
  status: NotificationStatus;
  relatedType: string;
  relatedId: string;
  resendEmailId?: string | null;
  error?: string | null;
}) {
  return prisma.notificationLog.create({ data });
}

export function wasNotificationSent(params: {
  organizationId: string;
  template: NotificationTemplate;
  relatedId: string;
  recipientEmail: string;
}) {
  return prisma.notificationLog.findFirst({
    where: {
      organizationId: params.organizationId,
      template: params.template,
      relatedId: params.relatedId,
      recipientEmail: params.recipientEmail,
      status: "sent",
    },
  });
}

export function listNotificationLogsForOrg(organizationId: string, limit = 50) {
  return prisma.notificationLog.findMany({
    where: { organizationId },
    orderBy: { sentAt: "desc" },
    take: limit,
  });
}
