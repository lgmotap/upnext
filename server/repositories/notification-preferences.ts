import { prisma } from "@/lib/db/prisma";
import type { NotificationSettingsInput } from "@/server/validators/notification-settings";

const SELECT = {
  notifyOwnerNewBooking: true,
  notifyCustomerBookingConfirmation: true,
  notifyCustomerReminder24h: true,
  notifyCustomerReminder2h: true,
  notifyCustomerJobCompleted: true,
  notifyCustomerPaymentRequest: true,
} as const;

export type NotificationPreferences = {
  notifyOwnerNewBooking: boolean;
  notifyCustomerBookingConfirmation: boolean;
  notifyCustomerReminder24h: boolean;
  notifyCustomerReminder2h: boolean;
  notifyCustomerJobCompleted: boolean;
  notifyCustomerPaymentRequest: boolean;
};

export async function getNotificationPreferences(
  organizationId: string,
): Promise<NotificationPreferences | null> {
  return prisma.businessProfile.findUnique({
    where: { organizationId },
    select: SELECT,
  });
}

export function updateNotificationPreferences(organizationId: string, data: NotificationSettingsInput) {
  return prisma.businessProfile.update({
    where: { organizationId },
    data,
  });
}
