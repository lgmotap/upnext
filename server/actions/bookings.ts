"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppSession } from "@/server/permissions/session";
import { canManageBookings } from "@/server/permissions/can";
import { createJobFromBookingRequest } from "@/server/services/jobs";
import { declineBookingRequest } from "@/server/services/bookings";

export async function acceptBookingAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageBookings(session)) redirect("/app/bookings?error=denied");

  const id = String(formData.get("bookingRequestId") ?? "");
  if (!id) redirect("/app/bookings");

  const result = await createJobFromBookingRequest(session.organizationId, id);
  if (!result.ok) redirect(`/app/bookings/${id}?error=${encodeURIComponent(result.error)}`);

  revalidatePath("/app/bookings");
  revalidatePath("/app/jobs");
  revalidatePath("/app/calendar");
  revalidatePath(`/app/bookings/${id}`);
  redirect(`/app/jobs/${result.jobId}`);
}

export async function declineBookingAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageBookings(session)) redirect("/app/bookings?error=denied");

  const id = String(formData.get("bookingRequestId") ?? "");
  if (!id) redirect("/app/bookings");

  const result = await declineBookingRequest(session.organizationId, id);
  if (!result.ok) redirect(`/app/bookings/${id}?error=${encodeURIComponent(result.error)}`);
  revalidatePath("/app/bookings");
  revalidatePath(`/app/bookings/${id}`);
  redirect(`/app/bookings/${id}`);
}

export async function bulkDeclineBookingsAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageBookings(session)) redirect("/app/bookings?error=denied");

  const ids = formData.getAll("bookingRequestId").map(String).filter(Boolean);
  if (ids.length === 0) redirect("/app/bookings");

  let declined = 0;
  for (const id of ids) {
    const result = await declineBookingRequest(session.organizationId, id);
    if (result.ok) declined++;
  }

  revalidatePath("/app/bookings");
  redirect(`/app/bookings?bulkDeclined=${declined}`);
}
