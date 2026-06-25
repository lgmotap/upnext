import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, ExternalLink } from "lucide-react";
import { Card, CardHeader } from "@/components/app/ui";
import { BookingLinkCard } from "@/components/app/BookingLinkCard";
import { CopyBookingLink } from "@/components/app/CopyBookingLink";
import { PortalFaqEditor } from "@/components/app/PortalFaqEditor";
import { getAppSession } from "@/server/permissions/session";
import { canManageBusiness } from "@/server/permissions/can";
import { getBusinessSetup } from "@/server/services/business";
import { updatePortalSettingsAction } from "@/server/actions/portal-settings";
import {
  saveCustomBookingHostAction,
  verifyCustomBookingHostAction,
} from "@/server/actions/custom-booking-domain";
import { getCustomerPortalUrl, isBookingUrlMisconfigured } from "@/lib/url/app";
import {
  getBookingEmbedHtmlForProfile,
  getBookingEmbedUrlForProfile,
  getBookingPageUrlForProfile,
  isCustomHostAppUrlMismatch,
} from "@/lib/url/booking";
import { DEFAULT_BOOKING_CNAME_TARGET } from "@/lib/booking/custom-host";
import { isCustomerPortalEnabled } from "@/lib/portal/enabled";
import { ensurePortalFaqDefaults, getPortalFaqFromProfile } from "@/server/services/portal-faq";

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
  const bookingProfile = {
    publicSlug: profile.publicSlug,
    customBookingHost: profile.customBookingHost,
    customBookingVerifiedAt: profile.customBookingVerifiedAt,
  };
  const bookingUrl = getBookingPageUrlForProfile(bookingProfile);
  const embedUrl = getBookingEmbedUrlForProfile(bookingProfile);
  const embedHtml = getBookingEmbedHtmlForProfile(bookingProfile);
  const portalUrl = getCustomerPortalUrl(profile.publicSlug);
  const misconfigured = isBookingUrlMisconfigured();
  const hostMismatch = isCustomHostAppUrlMismatch(bookingProfile);
  const customVerified = Boolean(profile.customBookingVerifiedAt && profile.customBookingHost);
  await ensurePortalFaqDefaults(session.organizationId);
  const faqItems = getPortalFaqFromProfile(profile);

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
      {params.saved === "custom_host" && (
        <p className="mb-4 rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-900">
          Custom booking host saved. Add DNS, then click Verify DNS.
        </p>
      )}
      {params.saved === "custom_host_verified" && (
        <p className="mb-4 rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-900">
          Custom domain verified — booking is live on your host.
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
            embedHtml={embedHtml}
            showMisconfigWarning={misconfigured}
          />
        </div>
      </Card>

      <Card className="mb-4 p-5">
        <CardHeader title="Custom booking domain" />
        <p className="mt-1 px-5 pb-3 text-sm text-ink-500">
          Serve booking at <code className="text-xs">book.yourbusiness.com</code> without the{" "}
          <code className="text-xs">/book/slug</code> path. Requires DNS + Vercel domain setup.
        </p>
        <div className="space-y-4 px-5 pb-5">
          {hostMismatch && (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-100">
              Your verified custom host differs from <code>NEXT_PUBLIC_APP_URL</code>. Booking
              links in emails use your custom domain; keep portal links on the main app host.
            </p>
          )}

          {canEdit ? (
            <form action={saveCustomBookingHostAction} className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-400">
                Custom booking host
              </label>
              <input
                name="customBookingHost"
                type="text"
                placeholder="book.yourbusiness.com"
                defaultValue={profile.customBookingHost ?? ""}
                className="w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-ink-900 ring-1 ring-ink-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  className="rounded-full bg-brand-400 px-4 py-2 text-sm font-semibold text-brand-950 hover:bg-brand-300"
                >
                  Save host
                </button>
                {profile.customBookingHost && (
                  <button
                    formAction={verifyCustomBookingHostAction}
                    type="submit"
                    className="rounded-full px-4 py-2 text-sm font-semibold text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50"
                  >
                    Verify DNS
                  </button>
                )}
              </div>
            </form>
          ) : (
            <p className="text-xs text-ink-400">Only owners and admins can edit the custom host.</p>
          )}

          {profile.customBookingHost && (
            <div className="rounded-xl bg-ink-50 px-4 py-3 text-sm text-ink-700 ring-1 ring-ink-100">
              <p className="font-semibold text-ink-900">DNS instructions</p>
              <ol className="mt-2 list-decimal space-y-1 pl-4 text-ink-600">
                <li>
                  Add a CNAME: <code className="text-xs">{profile.customBookingHost}</code> →{" "}
                  <code className="text-xs">{DEFAULT_BOOKING_CNAME_TARGET}</code>
                </li>
                <li>Add the same host in your Vercel project → Domains (Production).</li>
                <li>Click Verify DNS after propagation (usually 5–30 minutes).</li>
              </ol>
              <p className="mt-3 flex items-center gap-1.5 text-xs">
                {customVerified ? (
                  <>
                    <Check className="size-3.5 text-brand-600" />
                    <span className="font-semibold text-brand-800">Verified</span>
                    {profile.customBookingVerifiedAt && (
                      <span className="text-ink-500">
                        · {profile.customBookingVerifiedAt.toLocaleDateString()}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-ink-500">Not verified yet</span>
                )}
              </p>
              {customVerified && embedUrl && (
                <p className="mt-2 break-all font-mono text-xs text-ink-600">
                  Embed: {embedUrl}
                </p>
              )}
            </div>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <CardHeader title="Customer portal" />
        <p className="mt-1 text-sm text-ink-500">
          Returning customers sign in with a magic link (default) or optional email + password to
          view history, book again, and pay outstanding balances.
        </p>

        <form action={updatePortalSettingsAction} className="mt-4 space-y-4">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-ink-50 px-4 py-3 ring-1 ring-ink-100">
            <input
              type="checkbox"
              name="customerPortalEnabled"
              defaultChecked={isCustomerPortalEnabled(profile)}
              disabled={!canEdit}
              className="size-4 rounded border-ink-300 text-brand-600 focus:ring-brand-400"
            />
            <span className="text-sm font-semibold text-ink-900">Enable customer portal</span>
          </label>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-ink-50 px-4 py-3 ring-1 ring-ink-100">
            <input
              type="checkbox"
              name="portalPasswordLoginEnabled"
              defaultChecked={profile.portalPasswordLoginEnabled}
              disabled={!canEdit}
              className="size-4 rounded border-ink-300 text-brand-600 focus:ring-brand-400"
            />
            <div>
              <span className="text-sm font-semibold text-ink-900">Allow password sign-in</span>
              <p className="mt-0.5 text-xs text-ink-500">
                Optional alternative to magic links. Customers receive a password setup email on
                first portal invite when enabled.
              </p>
            </div>
          </label>

          <div>
            <p className="mb-2 text-sm font-semibold text-ink-900">Book again FAQ</p>
            <PortalFaqEditor initialItems={faqItems} disabled={!canEdit} />
          </div>

          {canEdit && (
            <button
              type="submit"
              className="rounded-full bg-brand-400 px-5 py-2.5 text-sm font-bold text-brand-950 hover:bg-brand-300"
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

        {portalUrl && isCustomerPortalEnabled(profile) && (
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
