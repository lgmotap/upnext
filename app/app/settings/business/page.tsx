import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardHeader } from "@/components/app/ui";
import { CopyBookingLink } from "@/components/app/CopyBookingLink";
import { getAppSession } from "@/server/permissions/session";
import { canManageBusiness } from "@/server/permissions/can";
import { getBusinessSetup } from "@/server/services/business";
import { updateBusinessSettingsAction } from "@/server/actions/settings";
import { CURRENCIES, TIMEZONES } from "@/server/validators/onboarding";

const input =
  "w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-ink-900 ring-1 ring-ink-200 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-400";

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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const bookingUrl = `${appUrl}/book/${profile.publicSlug}`;

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

      <Card className="mb-4 p-5">
        <h2 className="text-sm font-bold text-ink-950">Public booking link</h2>
        <p className="mt-1 text-sm text-ink-500">Share this link so customers can request appointments.</p>
        <div className="mt-3">
          <CopyBookingLink url={bookingUrl} />
        </div>
        <Link href={bookingUrl} target="_blank" className="mt-3 inline-block text-sm font-semibold text-brand-700">
          Preview booking page →
        </Link>
      </Card>

      <Card>
        <CardHeader title="Business profile" />
        <form action={updateBusinessSettingsAction} className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Business name" name="displayName" defaultValue={profile.displayName} disabled={!canEdit} />
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">
              Public booking slug
            </label>
            <div className="flex items-center rounded-xl bg-ink-50 px-3.5 py-2.5 text-sm text-ink-600 ring-1 ring-ink-200">
              /book/{profile.publicSlug}
            </div>
          </div>
          <Field label="Contact email" name="email" type="email" defaultValue={profile.email ?? ""} disabled={!canEdit} />
          <Field label="Phone" name="phone" defaultValue={profile.phone ?? ""} disabled={!canEdit} />
          <Field label="Service area" name="serviceArea" defaultValue={profile.serviceArea ?? ""} disabled={!canEdit} />
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">Timezone</label>
            <select
              name="timezone"
              defaultValue={setup.timezone}
              disabled={!canEdit}
              className={input}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">Currency</label>
            <select name="currency" defaultValue={setup.currency} disabled={!canEdit} className={input}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              defaultValue={profile.description ?? ""}
              disabled={!canEdit}
              className={input}
            />
          </div>
          {canEdit && (
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-full bg-brand-400 px-5 py-2.5 text-sm font-bold text-brand-950 hover:bg-brand-300"
              >
                Save changes
              </button>
            </div>
          )}
        </form>
      </Card>
    </>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  disabled,
}: {
  label: string;
  name: string;
  defaultValue: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        disabled={disabled}
        className={input}
      />
    </div>
  );
}
