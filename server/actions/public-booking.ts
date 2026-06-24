"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkRateLimit, rateLimitKeyFromHeaders } from "@/lib/rate-limit";
import { publicBookingSchema } from "@/server/validators/booking";
import { createPublicBooking } from "@/server/services/bookings";

export async function submitPublicBookingAction(formData: FormData): Promise<void> {
  const hdrs = await headers();
  const ip = rateLimitKeyFromHeaders(hdrs);
  const slug = String(formData.get("businessSlug") ?? "");
  const returnPath = formData.get("returnPath") === "embed" ? `/book/${slug}/embed` : `/book/${slug}`;
  if (!checkRateLimit(`public-booking:${ip}`, 10, 60 * 60 * 1000)) {
    redirect(slug ? `${returnPath}?error=rate_limit` : "/");
  }

  const parsed = publicBookingSchema.safeParse({
    businessSlug: formData.get("businessSlug"),
    serviceId: formData.get("serviceId"),
    addonServiceIds: formData.getAll("addonServiceIds"),
    date: formData.get("date"),
    time: formData.get("time"),
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
    frequency: formData.get("frequency"),
  });

  if (!parsed.success) {
    redirect(`${returnPath}?error=invalid`);
  }

  const result = await createPublicBooking(parsed.data);
  if (!result.ok) {
    redirect(`${returnPath}?error=${encodeURIComponent(result.error)}`);
  }

  redirect(`/book/${parsed.data.businessSlug}/confirmation/${result.bookingRequestId}`);
}
