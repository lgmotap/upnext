import { redirect } from "next/navigation";
import { Card, CardHeader } from "@/components/app/ui";
import { LocationAddressFields } from "@/components/app/LocationAddressFields";
import { getAppSession } from "@/server/permissions/session";
import { canManageBusiness } from "@/server/permissions/can";
import { listLocationsForOrg } from "@/server/repositories/locations";
import { createLocationAction, updateLocationAction } from "@/server/actions/locations";

const input =
  "mt-1 w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-ink-900 ring-1 ring-ink-200 focus:outline-none focus:ring-2 focus:ring-brand-400";

export default async function LocationsSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/sign-in?next=/app/settings/locations");

  const params = await searchParams;
  const locations = await listLocationsForOrg(session.organizationId);
  const canEdit = canManageBusiness(session);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Service locations" />
        <p className="mx-5 -mt-1 text-sm text-ink-500">
          Branches or territories under one brand. Customers choose a location on your booking page
          when you have two or more active locations. A display name is required; add an address so
          customers see something like &quot;North branch · Brooklyn, NY&quot;.
        </p>
        <p className="mx-5 mt-2 text-sm text-ink-500">
          <strong className="font-semibold text-ink-700">Where you accept jobs from</strong> is still
          set under Settings → Business (service area / ZIP or radius). Locations tag which branch
          handles the job — they don&apos;t replace coverage rules in v1.
        </p>

        {params.error && (
          <p className="mx-5 mt-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-rose-100">
            {decodeURIComponent(params.error)}
          </p>
        )}
        {params.saved === "1" && (
          <p className="mx-5 mt-4 rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-900 ring-1 ring-brand-100">
            Locations updated.
          </p>
        )}

        {locations.length === 0 && (
          <p className="mx-5 mt-4 text-sm text-ink-500">
            No locations yet. Your default location is created from business settings — add another
            branch below.
          </p>
        )}

        <ul className="divide-y divide-ink-100">
          {locations.map((loc) => (
            <li key={loc.id} className="p-5">
              <form action={updateLocationAction} className="space-y-3">
                <input type="hidden" name="locationId" value={loc.id} />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink-950">
                    {loc.name}
                    {loc.isDefault && (
                      <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-900">
                        Default
                      </span>
                    )}
                    {!loc.isActive && (
                      <span className="ml-2 rounded-full bg-ink-100 px-2 py-0.5 text-xs font-semibold text-ink-600">
                        Inactive
                      </span>
                    )}
                  </p>
                </div>
                {canEdit && (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block sm:col-span-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                          Name
                        </span>
                        <input name="name" required defaultValue={loc.name} className={input} />
                      </label>
                      <LocationAddressFields
                        formKey={loc.id}
                        defaults={{
                          addressLine1: loc.addressLine1 ?? "",
                          addressLine2: loc.addressLine2 ?? "",
                          city: loc.city ?? "",
                          region: loc.region ?? "",
                          postalCode: loc.postalCode ?? "",
                        }}
                      />
                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                          Phone
                        </span>
                        <input name="phone" defaultValue={loc.phone ?? ""} className={input} />
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          name="isDefault"
                          type="checkbox"
                          defaultChecked={loc.isDefault}
                          className="size-4 rounded border-ink-300"
                        />
                        <span className="text-sm font-medium text-ink-800">Default location</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          name="isActive"
                          type="checkbox"
                          defaultChecked={loc.isActive}
                          className="size-4 rounded border-ink-300"
                        />
                        <span className="text-sm font-medium text-ink-800">Active on booking page</span>
                      </label>
                    </div>
                    <button
                      type="submit"
                      className="rounded-full bg-brand-400 px-4 py-2 text-sm font-bold text-brand-950 hover:bg-brand-600"
                    >
                      Save location
                    </button>
                  </>
                )}
                {!canEdit && loc.addressLine1 && (
                  <p className="text-sm text-ink-600">
                    {[loc.addressLine1, loc.city, loc.region, loc.postalCode]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
              </form>
            </li>
          ))}
        </ul>

        {canEdit && (
          <form action={createLocationAction} className="space-y-4 border-t border-ink-100 p-5">
            <p className="text-sm font-semibold text-ink-950">Add location</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Name
                </span>
                <input name="name" required placeholder="North branch" className={input} />
              </label>
              <LocationAddressFields
                formKey="new"
                defaults={{
                  addressLine1: "",
                  city: "",
                  region: "",
                  postalCode: "",
                }}
              />
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Phone
                </span>
                <input name="phone" className={input} />
              </label>
            </div>
            <label className="flex items-center gap-2">
              <input name="isActive" type="checkbox" defaultChecked className="size-4 rounded border-ink-300" />
              <span className="text-sm font-medium text-ink-800">Active on booking page</span>
            </label>
            <button
              type="submit"
              className="rounded-full bg-brand-400 px-4 py-2 text-sm font-bold text-brand-950 hover:bg-brand-600"
            >
              Add location
            </button>
          </form>
        )}
      </Card>
    </div>
  );
}
