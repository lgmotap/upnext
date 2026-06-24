import { redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Card, CardHeader } from "@/components/app/ui";
import { BookingLinkCard } from "@/components/app/BookingLinkCard";
import { CopyBookingLink } from "@/components/app/CopyBookingLink";
import { getAppSession } from "@/server/permissions/session";
import { canManageBusiness } from "@/server/permissions/can";
import { getBusinessSetup } from "@/server/services/business";
import { updatePortalSettingsAction } from "@/server/actions/portal-settings";
import {
  getBookingPageUrl,
  getCustomerPortalUrl,
  isBookingUrlMisconfigured,
} from "@/lib/url/app";

export default async function PortalsSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/sign-in?next=/app/settings/portals");

  const params = await searchParams;
  const setup = await getBusinessSetup(session.organizationId);
  const profile = setup?.businessProfile;
  if (!setup || !profile) redirect("/app/onboarding");

  const canEdit = canManageBusiness(session);
  const bookingUrl = getBookingPageUrl(profile.publicSlug);
  const portalUrl = getCustomerPortalUrl(profile.publicSlug);
  const misconfigured = isBookingUrlMisconfigured();

  return (
    <>
      {params.error && (
        <p className="mb-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
          {decodeURIComponent(params.error)}
        </p>
      )}
      {params.saved === "1" && (
        <p className="mb-4 rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-900">
          Portal settings saved.
        </p>
      )}

      <Card className="mb-4 p-5">
        <CardHeader title="Public booking form" />
        <p className="mt-1 px-5 pb-3 text-sm text-ink-500">
          Standalone booking page for new customers.
        </p>
        <div className="px-5 pb-5">
          <BookingLinkCard
            url={bookingUrl}
            publicSlug={profile.publicSlug}
            showMisconfigWarning={misconfigured}
          />
        </div>
      </Card>

      <Card className="p-5">
        <CardHeader title="Customer portal" />
        <p className="mt-1 text-sm text-ink-500">
          Returning customers sign in with a magic link (no password) to view history, book again,
          and pay outstanding balances.
        </p>

        <form action={updatePortalSettingsAction} className="mt-4">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-ink-50 px-4 py-3 ring-1 ring-ink-100">
            <input
              type="checkbox"
              name="customerPortalEnabled"
              defaultChecked={profile.customerPortalEnabled}
              disabled={!canEdit}
              className="size-4 rounded border-ink-300 text-brand-600 focus:ring-brand-400"
            />
            <span className="text-sm font-semibold text-ink-900">Enable customer portal</span>
          </label>
          {canEdit && (
            <button
              type="submit"
              className="mt-3 rounded-full bg-brand-400 px-5 py-2.5 text-sm font-bold text-brand-950 hover:bg-brand-300"
            >
              Save portal settings
            </button>
          )}
        </form>

        <div className="mt-4 rounded-xl bg-ink-50 px-3.5 py-3 ring-1 ring-ink-200">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-400">Portal URL</p>
          <p className="mt-1 break-all font-mono text-sm text-ink-800">{portalUrl}</p>
          <div className="mt-2">
            <CopyBookingLink url={portalUrl} label="Copy portal link" />
          </div>
        </div>

        <p className="mt-4 text-xs text-ink-500">
          Send a magic link from any customer profile, or customers can request one at the portal URL.
        </p>

        {portalUrl && profile.customerPortalEnabled && (
          <Link
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
          >
            Preview customer portal <ExternalLink className="size-3.5" />
          </Link>
        )}
      </Card>
    </>
  );
}
