import { prisma } from "@/lib/db/prisma";
import type {
  NotificationSettingsInput,
  SmsNotificationSettingsInput,
} from "@/server/validators/notification-settings";

const SELECT = {
  notifyOwnerNewBooking: true,
  notifyCustomerBookingConfirmation: true,
  notifyCustomerReminder24h: true,
  notifyCustomerReminder2h: true,
  notifyCustomerJobCompleted: true,
  notifyCustomerPaymentRequest: true,
  smsEnabled: true,
  smsFromNumber: true,
  notifyCustomerSmsReminder24h: true,
  notifyCustomerSmsOnTheWay: true,
  notifyCustomerSmsRunningLate: true,
  notifyWorkerSmsJobAssigned: true,
} as const;

export type NotificationPreferences = {
  notifyOwnerNewBooking: boolean;
  notifyCustomerBookingConfirmation: boolean;
  notifyCustomerReminder24h: boolean;
  notifyCustomerReminder2h: boolean;
  notifyCustomerJobCompleted: boolean;
  notifyCustomerPaymentRequest: boolean;
  smsEnabled: boolean;
  smsFromNumber: string | null;
  notifyCustomerSmsReminder24h: boolean;
  notifyCustomerSmsOnTheWay: boolean;
  notifyCustomerSmsRunningLate: boolean;
  notifyWorkerSmsJobAssigned: boolean;
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

export function updateSmsNotificationPreferences(
  organizationId: string,
  data: SmsNotificationSettingsInput,
) {
  return prisma.businessProfile.update({
    where: { organizationId },
    data: {
      smsEnabled: data.smsEnabled,
      smsFromNumber: data.smsFromNumber || null,
      notifyCustomerSmsReminder24h: data.notifyCustomerSmsReminder24h,
      notifyCustomerSmsOnTheWay: data.notifyCustomerSmsOnTheWay,
      notifyCustomerSmsRunningLate: data.notifyCustomerSmsRunningLate,
      notifyWorkerSmsJobAssigned: data.notifyWorkerSmsJobAssigned,
    },
  });
}
