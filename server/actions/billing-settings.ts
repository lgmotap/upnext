"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppSession } from "@/server/permissions/session";
import { canManageBilling } from "@/server/permissions/can";
import { payAtBookingSettingsSchema } from "@/server/validators/pay-at-booking-settings";
import { updatePayAtBookingSettings } from "@/server/services/pay-at-booking";

function checkboxValue(formData: FormData, name: string): boolean {
  return formData.get(name) === "on";
}

export async function updatePayAtBookingSettingsAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageBilling(session)) {
    redirect("/app/settings/billing?error=denied");
  }

  const parsed = payAtBookingSettingsSchema.safeParse({
    payAtBookingEnabled: checkboxValue(formData, "payAtBookingEnabled"),
    requirePaymentAtBooking: checkboxValue(formData, "requirePaymentAtBooking"),
  });

  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors.requirePaymentAtBooking?.[0] ?? "invalid";
    redirect(`/app/settings/billing?error=${encodeURIComponent(msg)}`);
  }

  await updatePayAtBookingSettings(session.organizationId, parsed.data);
  revalidatePath("/app/settings/billing");
  revalidatePath("/book");
  redirect("/app/settings/billing?saved=pay_at_booking");
}
