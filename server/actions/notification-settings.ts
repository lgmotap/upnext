"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppSession } from "@/server/permissions/session";
import { canManageBusiness } from "@/server/permissions/can";
import { notificationSettingsSchema } from "@/server/validators/notification-settings";
import { updateNotificationPreferences } from "@/server/repositories/notification-preferences";

function checkboxValue(formData: FormData, name: string): boolean {
  return formData.get(name) === "on";
}

export async function updateNotificationSettingsAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageBusiness(session)) {
    redirect("/app/settings/notifications?error=denied");
  }

  const parsed = notificationSettingsSchema.safeParse({
    notifyOwnerNewBooking: checkboxValue(formData, "notifyOwnerNewBooking"),
    notifyCustomerBookingConfirmation: checkboxValue(formData, "notifyCustomerBookingConfirmation"),
    notifyCustomerReminder24h: checkboxValue(formData, "notifyCustomerReminder24h"),
    notifyCustomerReminder2h: checkboxValue(formData, "notifyCustomerReminder2h"),
    notifyCustomerJobCompleted: checkboxValue(formData, "notifyCustomerJobCompleted"),
    notifyCustomerPaymentRequest: checkboxValue(formData, "notifyCustomerPaymentRequest"),
  });

  if (!parsed.success) {
    redirect("/app/settings/notifications?error=invalid");
  }

  await updateNotificationPreferences(session.organizationId, parsed.data);
  revalidatePath("/app/settings/notifications");
  redirect("/app/settings/notifications?saved=1");
}
