import { redirect } from "next/navigation";
import { BusinessLogoUpload } from "@/components/app/BusinessLogoUpload";
import { BusinessProfileForm } from "@/components/app/BusinessProfileForm";
import {
  inferServiceAreaCustom,
  inferServiceAreaScope,
} from "@/lib/business/service-area";
import { updateBusinessSettingsAction } from "@/server/actions/settings";
import { canManageBusiness } from "@/server/permissions/can";
import { getAppSession } from "@/server/permissions/session";
import { getBusinessSetup } from "@/server/services/business";

export default async function BusinessSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/sign-in?next=/app/settings/business");

  const params = await searchParams;
  const setup = await getBusinessSetup(session.organizationId);
  const profile = setup?.businessProfile;
  if (!setup || !profile) redirect("/app/onboarding");

  const canEdit = canManageBusiness(session);

  const city = profile.city ?? "";
  const region = profile.region ?? "";
  const serviceAreaScope = inferServiceAreaScope(profile.serviceArea, city, region);

  return (
    <>
      {params.error && (
        <p className="mb-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-rose-100">
          {decodeURIComponent(params.error)}
        </p>
      )}
      {params.saved === "1" && (
        <p className="mb-4 rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-900 ring-1 ring-brand-100">
          Business settings saved.
        </p>
      )}
      {params.saved === "logo" && (
        <p className="mb-4 rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-900 ring-1 ring-brand-100">
          Logo uploaded.
        </p>
      )}
      {params.saved === "logo_removed" && (
        <p className="mb-4 rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-900 ring-1 ring-brand-100">
          Logo removed.
        </p>
      )}

      <div className="mb-4">
        <BusinessLogoUpload
          logoUrl={profile.logoUrl}
          displayName={profile.displayName}
          canEdit={canEdit}
        />
      </div>

      <BusinessProfileForm
        canEdit={canEdit}
        publicSlug={profile.publicSlug}
        action={updateBusinessSettingsAction}
        defaults={{
          businessType: profile.businessType ?? "",
          teamSize: profile.teamSize ?? "",
          addressLine1: profile.addressLine1 ?? "",
          addressLine2: profile.addressLine2 ?? "",
          city,
          region,
          postalCode: profile.postalCode ?? "",
          country: profile.country ?? "US",
          displayName: profile.displayName,
          email: profile.email ?? "",
          phone: profile.phone ?? "",
          timezone: setup.timezone,
          currency: setup.currency,
          description: profile.description ?? "",
          websiteUrl: profile.websiteUrl ?? "",
          serviceAreaScope,
          serviceAreaCustom: inferServiceAreaCustom(
            profile.serviceArea,
            city,
            region,
            serviceAreaScope,
          ),
        }}
      />
    </>
  );
}
