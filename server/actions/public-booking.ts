"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkRateLimit, rateLimitKeyFromHeaders } from "@/lib/rate-limit";
import { publicBookingSchema } from "@/server/validators/booking";
import { createPublicBooking, createPublicBookingCheckout } from "@/server/services/bookings";
import { getPayAtBookingSettingsForOrg } from "@/server/services/pay-at-booking";
import { getBusinessProfileBySlug } from "@/server/repositories/services";
import { listActiveBookingFormFields } from "@/server/repositories/booking-form-fields";
import {
  buildCustomFieldsValidator,
  parseCustomFieldsFromForm,
} from "@/server/validators/booking-form-fields";

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
    bedrooms: formData.get("bedrooms"),
    bathrooms: formData.get("bathrooms"),
    half_bathrooms: formData.get("half_bathrooms"),
    square_feet: formData.get("square_feet"),
  });

  if (!parsed.success) {
    redirect(`${returnPath}?error=invalid`);
  }

  const profile = await getBusinessProfileBySlug(parsed.data.businessSlug);
  if (!profile) {
    redirect(`${returnPath}?error=invalid`);
  }

  const customFields = await listActiveBookingFormFields(profile.organizationId);
  const rawCustom = parseCustomFieldsFromForm(customFields, formData);
  const customParsed = buildCustomFieldsValidator(customFields).safeParse(rawCustom);
  if (!customParsed.success) {
    redirect(`${returnPath}?error=invalid`);
  }

  const bookingInput = {
    ...parsed.data,
    customFieldsJson:
      Object.keys(customParsed.data).length > 0
        ? (customParsed.data as Record<string, string | boolean>)
        : undefined,
  };

  const payNow = formData.get("payAtBooking") === "on";
  if (payNow) {
    const settings = await getPayAtBookingSettingsForOrg(profile.organizationId);
    if (!settings?.payAtBookingEnabled) {
      redirect(`${returnPath}?error=${encodeURIComponent("Pay at booking is not enabled")}`);
    }

    const checkoutResult = await createPublicBookingCheckout(bookingInput);
    if (!checkoutResult.ok) {
      redirect(`${returnPath}?error=${encodeURIComponent(checkoutResult.error)}`);
    }
    redirect(checkoutResult.checkoutUrl);
  }

  const settings = await getPayAtBookingSettingsForOrg(profile.organizationId);
  if (settings?.requirePaymentAtBooking) {
    redirect(
      `${returnPath}?error=${encodeURIComponent("Payment is required to complete this booking")}`,
    );
  }

  const result = await createPublicBooking(bookingInput);
  if (!result.ok) {
    redirect(`${returnPath}?error=${encodeURIComponent(result.error)}`);
  }

  redirect(`/book/${parsed.data.businessSlug}/confirmation/${result.bookingRequestId}`);
}
