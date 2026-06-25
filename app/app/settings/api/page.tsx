import { redirect } from "next/navigation";
import { Card } from "@/components/app/ui";
import { FormSubmitButton } from "@/components/app/FormSubmitButton";
import { getAppSession } from "@/server/permissions/session";
import { canManageBilling } from "@/server/permissions/can";
import { listApiKeys } from "@/server/repositories/api-keys";
import {
  ALL_WEBHOOK_EVENTS,
  listWebhookDeliveries,
  listWebhookEndpoints,
  WEBHOOK_EVENT_LABELS,
} from "@/server/repositories/webhooks";
import {
  createApiKeyAction,
  createWebhookAction,
  deactivateWebhookAction,
  revokeApiKeyAction,
} from "@/server/actions/api-settings";
import { site } from "@/lib/config";

export default async function ApiSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    created_key?: string;
    revoked?: string;
    webhook_secret?: string;
    webhook_removed?: string;
  }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/sign-in?next=/app/settings/api");
  if (!canManageBilling(session)) redirect("/app/settings/business?error=Permission%20denied");

  const params = await searchParams;
  const [apiKeys, webhooks, deliveries] = await Promise.all([
    listApiKeys(session.organizationId),
    listWebhookEndpoints(session.organizationId),
    listWebhookDeliveries(session.organizationId),
  ]);

  return (
    <>
      <p className="mb-4 text-sm text-ink-500">
        API keys and webhooks for integrations (Zapier, custom tools).
      </p>

      {params.error && (
        <p className="mb-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-rose-100">
          {decodeURIComponent(params.error)}
        </p>
      )}
      {params.created_key && (
        <p className="mb-4 rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900 ring-1 ring-amber-100">
          <span className="font-semibold">Copy your API key now</span> — it won&apos;t be shown again:
          <code className="mt-2 block break-all rounded-lg bg-white px-2 py-1 text-xs">
            {params.created_key}
          </code>
        </p>
      )}
      {params.revoked === "1" && (
        <p className="mb-4 rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-800 ring-1 ring-brand-100">
          API key revoked.
        </p>
      )}
      {params.webhook_secret && (
        <p className="mb-4 rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900 ring-1 ring-amber-100">
          <span className="font-semibold">Webhook signing secret</span> (verify{' '}
          <code className="text-xs">BookedFox-Signature</code> header):
          <code className="mt-2 block break-all rounded-lg bg-white px-2 py-1 text-xs">
            {params.webhook_secret}
          </code>
        </p>
      )}
      {params.webhook_removed === "1" && (
        <p className="mb-4 rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-800 ring-1 ring-brand-100">
          Webhook endpoint deactivated.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="border-b border-ink-100 px-5 py-3">
            <h2 className="text-sm font-bold text-ink-950">API keys</h2>
            <p className="mt-0.5 text-xs text-ink-500">
              Bearer auth for <code className="text-[11px]">GET /api/v1/*</code>
            </p>
          </div>
          <ul className="divide-y divide-ink-100">
            {apiKeys.length === 0 ? (
              <li className="px-5 py-4 text-sm text-ink-500">No keys yet.</li>
            ) : (
              apiKeys.map((k) => (
                <li key={k.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div>
                    <p className="text-sm font-semibold text-ink-950">{k.name}</p>
                    <p className="font-mono text-xs text-ink-500">{k.keyPrefix}…</p>
                  </div>
                  <form action={revokeApiKeyAction}>
                    <input type="hidden" name="apiKeyId" value={k.id} />
                    <button
                      type="submit"
                      className="rounded-full px-3 py-1 text-xs font-semibold text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50"
                    >
                      Revoke
                    </button>
                  </form>
                </li>
              ))
            )}
          </ul>
          <form action={createApiKeyAction} className="flex flex-wrap items-end gap-3 border-t border-ink-100 px-5 py-4">
            <div className="min-w-[12rem] flex-1">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-400">
                Key name
              </label>
              <input
                name="name"
                required
                placeholder="Zapier sync"
                className="w-full rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-ink-200"
              />
            </div>
            <FormSubmitButton loadingLabel="Creating…">Create key</FormSubmitButton>
          </form>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-ink-100 px-5 py-3">
            <h2 className="text-sm font-bold text-ink-950">Webhooks</h2>
            <p className="mt-0.5 text-xs text-ink-500">POST JSON to your URL on business events.</p>
          </div>
          <ul className="divide-y divide-ink-100">
            {webhooks.length === 0 ? (
              <li className="px-5 py-4 text-sm text-ink-500">No endpoints yet.</li>
            ) : (
              webhooks.map((w) => (
                <li key={w.id} className="px-5 py-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink-950">{w.url}</p>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {w.events.map((e) => WEBHOOK_EVENT_LABELS[e]).join(" · ")}
                        {!w.isActive && " · inactive"}
                      </p>
                    </div>
                    {w.isActive && (
                      <form action={deactivateWebhookAction}>
                        <input type="hidden" name="endpointId" value={w.id} />
                        <button
                          type="submit"
                          className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-rose-600 ring-1 ring-rose-200"
                        >
                          Remove
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              ))
            )}
          </ul>
          <form action={createWebhookAction} className="space-y-3 border-t border-ink-100 px-5 py-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-400">
                Endpoint URL
              </label>
              <input
                name="url"
                type="url"
                required
                placeholder="https://hooks.example.com/bookedfox"
                className="w-full rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-ink-200"
              />
            </div>
            <fieldset>
              <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
                Events
              </legend>
              <div className="flex flex-wrap gap-2">
                {ALL_WEBHOOK_EVENTS.map((event) => (
                  <label
                    key={event}
                    className="inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-3 py-1 text-xs font-medium text-ink-700 ring-1 ring-ink-200"
                  >
                    <input type="checkbox" name="events" value={event} className="size-3.5" />
                    {WEBHOOK_EVENT_LABELS[event]}
                  </label>
                ))}
              </div>
            </fieldset>
            <FormSubmitButton loadingLabel="Saving…">Add webhook</FormSubmitButton>
          </form>
        </Card>
      </div>

      {deliveries.length > 0 && (
        <Card className="mt-6 overflow-hidden">
          <div className="border-b border-ink-100 px-5 py-3">
            <h2 className="text-sm font-bold text-ink-950">Recent deliveries</h2>
          </div>
          <ul className="divide-y divide-ink-100">
            {deliveries.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                <span className="font-medium text-ink-950">{WEBHOOK_EVENT_LABELS[d.event]}</span>
                <span className="text-xs text-ink-500">{d.status}</span>
                {d.responseStatus != null && (
                  <span className="text-xs text-ink-400">HTTP {d.responseStatus}</span>
                )}
                {d.lastError && (
                  <span className="text-xs text-rose-600">{d.lastError}</span>
                )}
                <span className="ml-auto text-xs text-ink-400">
                  {d.createdAt.toISOString().slice(0, 19)}Z
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
