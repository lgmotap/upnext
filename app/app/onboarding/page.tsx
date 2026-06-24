import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAppSession } from "@/server/permissions/session";
import { getBusinessSetup } from "@/server/services/business";
import { OnboardingWizard } from "./OnboardingWizard";
import { getBookingPageUrl } from "@/lib/url/app";

export const metadata: Metadata = {
  title: "Set up your business",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/sign-in?next=/app/onboarding");

  const setup = await getBusinessSetup(session.organizationId);
  const profile = setup?.businessProfile;
  if (profile?.onboardingCompletedAt) {
    redirect("/api/onboarding/sync-cookie?next=/app/dashboard");
  }

  const slug = profile?.publicSlug ?? setup?.slug ?? "";
  const { error } = await searchParams;

  return (
    <div className="py-6">
      <OnboardingWizard
        error={error}
        bookingUrl={getBookingPageUrl(slug)}
        defaults={{
          businessType: profile?.businessType ?? "",
          teamSize: profile?.teamSize ?? "",
          addressLine1: profile?.addressLine1 ?? "",
          addressLine2: profile?.addressLine2 ?? "",
          city: profile?.city ?? "",
          region: profile?.region ?? "",
          postalCode: profile?.postalCode ?? "",
          country: profile?.country ?? "US",
          displayName: profile?.displayName ?? setup?.name ?? "",
          timezone: setup?.timezone ?? "America/New_York",
          currency: setup?.currency ?? "USD",
          serviceArea: profile?.serviceArea ?? "",
          phone: profile?.phone ?? "",
          description: profile?.description ?? "",
        }}
      />
    </div>
  );
}
