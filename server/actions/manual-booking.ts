"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppSession } from "@/server/permissions/session";
import { canManageBookings } from "@/server/permissions/can";
import { manualBookingSchema } from "@/server/validators/booking";
import { createManualBooking } from "@/server/services/bookings";
import { createJobCheckoutSession } from "@/server/services/payments";
import { isPayAtBookingAvailable } from "@/server/services/pay-at-booking";
import { listActiveBookingFormFields } from "@/server/repositories/booking-form-fields";
import {
  buildCustomFieldsValidator,
  parseCustomFieldsFromForm,
} from "@/server/validators/booking-form-fields";

function parseAddonIds(formData: FormData): string[] {
  return formData.getAll("addonServiceIds").map(String).filter(Boolean);
}

export async function submitManualBookingAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageBookings(session)) redirect("/app/bookings/new?error=denied");

  const customFieldDefs = await listActiveBookingFormFields(session.organizationId);
  const customFieldsRaw = parseCustomFieldsFromForm(customFieldDefs, formData);
  let customFieldsJson: Record<string, string | boolean> | undefined;
  if (customFieldDefs.length > 0) {
    const customValidator = buildCustomFieldsValidator(customFieldDefs);
    const customParsed = customValidator.safeParse(customFieldsRaw);
    if (!customParsed.success) {
      redirect("/app/bookings/new?error=invalid");
    }
    customFieldsJson = customParsed.data as Record<string, string | boolean>;
  }

  const paymentMode = String(formData.get("paymentMode") ?? "bill_later");

  const parsed = manualBookingSchema.safeParse({
    serviceId: formData.get("serviceId"),
    addonServiceIds: parseAddonIds(formData),
    date: formData.get("date"),
    time: formData.get("time"),
    customerId: formData.get("customerId"),
    customerAddressId: formData.get("customerAddressId"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    line1: formData.get("line1"),
    line2: formData.get("line2"),
    city: formData.get("city"),
    region: formData.get("region"),
    postalCode: formData.get("postalCode"),
    locationId: formData.get("locationId"),
    customerNotes: formData.get("customerNotes"),
    assignMembershipId: formData.get("assignMembershipId"),
    frequency: formData.get("frequency"),
    bedrooms: formData.get("bedrooms"),
    bathrooms: formData.get("bathrooms"),
    half_bathrooms: formData.get("half_bathrooms"),
    square_feet: formData.get("square_feet"),
    collectPaymentNow: paymentMode === "collect_now",
    overrideServiceArea: formData.get("overrideServiceArea"),
    customFieldsJson,
  });

  if (!parsed.success) {
    redirect("/app/bookings/new?error=invalid");
  }

  const result = await createManualBooking(session.organizationId, parsed.data);
  if (!result.ok) {
    redirect(`/app/bookings/new?error=${encodeURIComponent(result.error)}`);
  }

  if (parsed.data.collectPaymentNow) {
    const payAvailable = await isPayAtBookingAvailable(session.organizationId);
    if (payAvailable) {
      const checkout = await createJobCheckoutSession(session.organizationId, result.jobId);
      if (checkout.ok && checkout.url) {
        revalidatePath("/app/bookings");
        revalidatePath("/app/jobs");
        redirect(checkout.url);
      }
    }
  }

  revalidatePath("/app/bookings");
  revalidatePath("/app/jobs");
  revalidatePath("/app/calendar");
  revalidatePath("/app/customers");
  revalidatePath("/app/dashboard");
  redirect(`/app/jobs/${result.jobId}`);
}
