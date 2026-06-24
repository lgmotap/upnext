"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppSession } from "@/server/permissions/session";
import { canManageBookings } from "@/server/permissions/can";
import { manualBookingSchema } from "@/server/validators/booking";
import { createManualBooking } from "@/server/services/bookings";

function parseAddonIds(formData: FormData): string[] {
  return formData.getAll("addonServiceIds").map(String).filter(Boolean);
}

export async function submitManualBookingAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageBookings(session)) redirect("/app/bookings/new?error=denied");

  const parsed = manualBookingSchema.safeParse({
    serviceId: formData.get("serviceId"),
    addonServiceIds: parseAddonIds(formData),
    date: formData.get("date"),
    time: formData.get("time"),
    customerId: formData.get("customerId"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    line1: formData.get("line1"),
    line2: formData.get("line2"),
    city: formData.get("city"),
    region: formData.get("region"),
    postalCode: formData.get("postalCode"),
    customerNotes: formData.get("customerNotes"),
    assignMembershipId: formData.get("assignMembershipId"),
    frequency: formData.get("frequency"),
    bedrooms: formData.get("bedrooms"),
    bathrooms: formData.get("bathrooms"),
  });

  if (!parsed.success) {
    redirect("/app/bookings/new?error=invalid");
  }

  const result = await createManualBooking(session.organizationId, parsed.data);
  if (!result.ok) {
    redirect(`/app/bookings/new?error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/app/bookings");
  revalidatePath("/app/jobs");
  revalidatePath("/app/calendar");
  revalidatePath("/app/customers");
  revalidatePath("/app/dashboard");
  redirect(`/app/jobs/${result.jobId}`);
}
