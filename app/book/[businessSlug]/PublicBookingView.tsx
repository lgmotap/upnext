import { notFound } from "next/navigation";
import { PublicBookingClient } from "./PublicBookingClient";
import { PublicBookingEmpty } from "@/components/booking/PublicBookingEmpty";
import { loadPublicBookingPage } from "@/server/services/public-booking-page";

export async function PublicBookingView({
  businessSlug,
  searchParams,
  embedded = false,
}: {
  businessSlug: string;
  searchParams: Record<string, string | string[] | undefined>;
  embedded?: boolean;
}) {
  const data = await loadPublicBookingPage(businessSlug, searchParams, { embedded });

  if (data.kind === "not_found") notFound();
  if (data.kind === "empty") {
    return <PublicBookingEmpty businessName={data.businessName} embedded={embedded} />;
  }

  return (
    <PublicBookingClient
      businessSlug={data.businessSlug}
      timeZone={data.timeZone}
      business={data.business}
      primaryServices={data.primaryServices}
      addonServices={data.addonServices}
      initialDays={data.initialDays}
      initialSlots={data.initialSlots}
      initialServiceId={data.initialServiceId}
      initialDate={data.initialDate}
      initialTime={data.initialTime}
      prefill={data.prefill}
      error={data.error}
      embedded={data.embedded}
      returnPath={embedded ? "embed" : "full"}
      payAtBooking={data.payAtBooking}
      customFormFields={data.customFormFields}
    />
  );
}
