import { Card, CardHeader, AppButton } from "@/components/app/ui";
import { business } from "@/lib/mock/data";

const input =
  "w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-ink-900 ring-1 ring-ink-200 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-400";

export default function BusinessSettingsPage() {
  return (
    <Card>
      <CardHeader title="Business profile" action={<AppButton>Save changes</AppButton>} />
      <div className="grid gap-4 p-5 sm:grid-cols-2">
        <Field label="Business name" defaultValue={business.name} />
        <Field label="Public booking slug" defaultValue={business.slug} prefix="upnext.app/book/" />
        <Field label="Contact email" defaultValue={business.email} type="email" />
        <Field label="Phone" defaultValue={business.phone} />
        <Field label="Service area" defaultValue={business.serviceArea} />
        <Field label="Timezone" defaultValue="America/New_York" />
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">Description</label>
          <textarea
            rows={3}
            defaultValue="Reliable residential and commercial cleaning across Greater Austin."
            className={input}
          />
        </div>
      </div>
    </Card>
  );
}

function Field({
  label,
  defaultValue,
  type = "text",
  prefix,
}: {
  label: string;
  defaultValue: string;
  type?: string;
  prefix?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</label>
      <div className="flex items-center rounded-xl bg-white ring-1 ring-ink-200 focus-within:ring-2 focus-within:ring-brand-400">
        {prefix && <span className="pl-3 text-sm text-ink-400">{prefix}</span>}
        <input
          type={type}
          defaultValue={defaultValue}
          className="w-full rounded-xl bg-transparent px-3.5 py-2.5 text-sm text-ink-900 focus:outline-none"
        />
      </div>
    </div>
  );
}
