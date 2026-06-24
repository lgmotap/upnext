import type { Service } from "@/generated/prisma/client";
import { createServiceAction, updateServiceAction } from "@/server/actions/services";

const input =
  "w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-ink-900 ring-1 ring-ink-200 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-400";

export function ServiceForm({
  service,
  checklistItems = "",
}: {
  service?: Service;
  checklistItems?: string;
}) {
  const action = service ? updateServiceAction : createServiceAction;
  const priceDollars = service ? (service.basePriceCents / 100).toFixed(2) : "";

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {service && <input type="hidden" name="serviceId" value={service.id} />}
      <div className="sm:col-span-2">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">
          Name
        </label>
        <input name="name" required defaultValue={service?.name} className={input} placeholder="Standard Clean" />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">
          Description
        </label>
        <textarea
          name="description"
          rows={2}
          defaultValue={service?.description ?? ""}
          className={input}
          placeholder="Optional short description"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">
          Duration (minutes)
        </label>
        <input
          name="durationMinutes"
          type="number"
          min={15}
          step={15}
          required
          defaultValue={service?.durationMinutes ?? 120}
          className={input}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">
          Price (USD)
        </label>
        <input
          name="priceDollars"
          type="number"
          min={0}
          step={0.01}
          required
          defaultValue={priceDollars}
          className={input}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input type="checkbox" name="isActive" defaultChecked={service?.isActive ?? true} className="rounded" />
        Active (visible to team)
      </label>
      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input type="checkbox" name="isPublic" defaultChecked={service?.isPublic ?? true} className="rounded" />
        Public (on booking page)
      </label>
      <label className="flex items-center gap-2 text-sm text-ink-700 sm:col-span-2">
        <input type="checkbox" name="isAddon" defaultChecked={service?.isAddon ?? false} className="rounded" />
        Add-on service (optional extra — not a main booking service)
      </label>
      <div className="sm:col-span-2">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">
          Crew checklist (one item per line)
        </label>
        <textarea
          name="checklistItems"
          rows={5}
          defaultValue={checklistItems}
          className={input}
          placeholder={"Kitchen — counters & appliances\nBathrooms — full clean\nBedrooms — vacuum & dust"}
        />
        <p className="mt-1.5 text-xs text-ink-400">
          Copied to each new job for this service. Workers complete items on the crew job page.
        </p>
      </div>
      <div className="sm:col-span-2">
        <button
          type="submit"
          className="rounded-full bg-brand-400 px-5 py-2.5 text-sm font-bold text-brand-950 hover:bg-brand-300"
        >
          {service ? "Save changes" : "Create service"}
        </button>
      </div>
    </form>
  );
}
