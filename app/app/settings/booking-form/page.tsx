import { redirect } from "next/navigation";
import { Card, CardHeader } from "@/components/app/ui";
import { CustomBookingFields } from "@/components/booking/CustomBookingFields";
import { getAppSession } from "@/server/permissions/session";
import { canManageBusiness } from "@/server/permissions/can";
import {
  listBookingFormFields,
  MAX_FIELDS,
} from "@/server/repositories/booking-form-fields";
import {
  createBookingFormFieldAction,
  deleteBookingFormFieldAction,
  moveBookingFormFieldAction,
} from "@/server/actions/booking-form-fields";
import { bookingFormFieldTypes } from "@/server/validators/booking-form-fields";

export default async function BookingFormSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/sign-in?next=/app/settings/booking-form");

  const params = await searchParams;
  const fields = await listBookingFormFields(session.organizationId);
  const canEdit = canManageBusiness(session);
  const activePreview = fields.filter((f) => f.active);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Booking form fields" />
        <p className="mx-5 -mt-1 text-sm text-ink-500">
          Add up to {MAX_FIELDS} custom questions on your public booking page.
        </p>
        {params.error && (
          <p className="mx-5 mt-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-rose-100">
            {params.error === "denied"
              ? "You do not have permission to edit booking fields."
              : params.error === "limit"
                ? `Maximum ${MAX_FIELDS} fields reached.`
                : "Could not save field."}
          </p>
        )}
        {params.saved === "1" && (
          <p className="mx-5 mt-4 rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-900 ring-1 ring-brand-100">
            Booking form updated.
          </p>
        )}

        {fields.length > 0 && (
          <ul className="divide-y divide-ink-100">
            {fields.map((field, index) => (
              <li key={field.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-950">
                    {field.label}
                    {field.required && <span className="text-rose-500"> *</span>}
                  </p>
                  <p className="text-xs text-ink-500">
                    {field.fieldType} · key: {field.key}
                  </p>
                </div>
                {canEdit && (
                  <div className="flex items-center gap-1">
                    <form action={moveBookingFormFieldAction}>
                      <input type="hidden" name="id" value={field.id} />
                      <input type="hidden" name="direction" value="up" />
                      <button
                        type="submit"
                        disabled={index === 0}
                        className="rounded-lg px-2 py-1 text-xs font-semibold text-ink-500 hover:bg-ink-50 disabled:opacity-30"
                      >
                        ↑
                      </button>
                    </form>
                    <form action={moveBookingFormFieldAction}>
                      <input type="hidden" name="id" value={field.id} />
                      <input type="hidden" name="direction" value="down" />
                      <button
                        type="submit"
                        disabled={index === fields.length - 1}
                        className="rounded-lg px-2 py-1 text-xs font-semibold text-ink-500 hover:bg-ink-50 disabled:opacity-30"
                      >
                        ↓
                      </button>
                    </form>
                    <form action={deleteBookingFormFieldAction}>
                      <input type="hidden" name="id" value={field.id} />
                      <button
                        type="submit"
                        className="rounded-lg px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {canEdit && fields.length < MAX_FIELDS && (
          <form action={createBookingFormFieldAction} className="space-y-4 border-t border-ink-100 p-5">
            <p className="text-sm font-semibold text-ink-950">Add field</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">Label</span>
                <input
                  name="label"
                  required
                  maxLength={120}
                  placeholder="Gate code"
                  className="mt-1 w-full rounded-xl bg-white px-3.5 py-2.5 text-sm ring-1 ring-ink-200"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">Type</span>
                <select
                  name="fieldType"
                  defaultValue="text"
                  className="mt-1 w-full rounded-xl bg-white px-3.5 py-2.5 text-sm ring-1 ring-ink-200"
                >
                  {bookingFormFieldTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 self-end pb-2">
                <input name="required" type="checkbox" className="size-4 rounded border-ink-300" />
                <span className="text-sm font-medium text-ink-800">Required</span>
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Options (select only, one per line)
                </span>
                <textarea
                  name="options"
                  rows={3}
                  placeholder={"Option A\nOption B"}
                  className="mt-1 w-full rounded-xl bg-white px-3.5 py-2.5 text-sm ring-1 ring-ink-200"
                />
              </label>
            </div>
            <button
              type="submit"
              className="rounded-full bg-brand-400 px-4 py-2 text-sm font-bold text-brand-950 hover:bg-brand-300"
            >
              Add field
            </button>
          </form>
        )}
      </Card>

      {activePreview.length > 0 && (
        <Card>
          <CardHeader title="Preview" />
          <p className="mx-5 -mt-1 text-sm text-ink-500">How fields appear on the public booking form.</p>
          <div className="p-5">
            <CustomBookingFields fields={activePreview} />
          </div>
        </Card>
      )}
    </div>
  );
}
