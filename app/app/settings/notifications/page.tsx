import { redirect } from "next/navigation";
import { Card, CardHeader } from "@/components/app/ui";
import { getAppSession } from "@/server/permissions/session";
import { canManageBusiness } from "@/server/permissions/can";
import { getNotificationPreferences } from "@/server/repositories/notification-preferences";
import { updateNotificationSettingsAction } from "@/server/actions/notification-settings";
import { NOTIFICATION_SETTING_META } from "@/server/validators/notification-settings";

export default async function NotificationSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/sign-in?next=/app/settings/notifications");

  const params = await searchParams;
  const prefs = await getNotificationPreferences(session.organizationId);
  const canEdit = canManageBusiness(session);

  const values = {
    notifyOwnerNewBooking: prefs?.notifyOwnerNewBooking ?? true,
    notifyCustomerBookingConfirmation: prefs?.notifyCustomerBookingConfirmation ?? true,
    notifyCustomerReminder24h: prefs?.notifyCustomerReminder24h ?? true,
    notifyCustomerReminder2h: prefs?.notifyCustomerReminder2h ?? false,
    notifyCustomerJobCompleted: prefs?.notifyCustomerJobCompleted ?? true,
    notifyCustomerPaymentRequest: prefs?.notifyCustomerPaymentRequest ?? true,
  };

  return (
    <Card>
      <CardHeader title="Email notifications" />
      {params.error && (
        <p className="mx-5 mt-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-rose-100">
          {params.error === "denied" ? "You do not have permission to change these settings." : "Could not save settings."}
        </p>
      )}
      {params.saved === "1" && (
        <p className="mx-5 mt-4 rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-900 ring-1 ring-brand-100">
          Notification settings saved.
        </p>
      )}
      <form action={updateNotificationSettingsAction}>
        <ul className="divide-y divide-ink-100">
          {NOTIFICATION_SETTING_META.map((s) => (
            <li key={s.key} className="flex items-center gap-4 px-5 py-3.5">
              <div className="min-w-0 flex-1">
                <label htmlFor={s.key} className="text-sm font-semibold text-ink-950">
                  {s.label}
                </label>
                <p className="text-xs text-ink-500">{s.desc}</p>
              </div>
              <input
                id={s.key}
                name={s.key}
                type="checkbox"
                defaultChecked={values[s.key]}
                disabled={!canEdit}
                className="size-5 rounded border-ink-300 text-brand-600 focus:ring-brand-400"
              />
            </li>
          ))}
        </ul>
        {canEdit && (
          <div className="border-t border-ink-100 px-5 py-4">
            <button
              type="submit"
              className="rounded-full bg-brand-400 px-4 py-2 text-sm font-bold text-brand-950 hover:bg-brand-300"
            >
              Save notification settings
            </button>
          </div>
        )}
      </form>
    </Card>
  );
}
