"use client";

import { FormSubmitButton } from "@/components/app/FormSubmitButton";
import { updateCustomerTagsAction } from "@/server/actions/customers";

const input =
  "w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-ink-900 ring-1 ring-ink-200 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-400";

export function CustomerTagsForm({
  customerId,
  tags,
  canEdit,
}: {
  customerId: string;
  tags: string[];
  canEdit: boolean;
}) {
  if (!canEdit) {
    return tags.length === 0 ? (
      <p className="text-sm text-ink-500">No tags.</p>
    ) : (
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <span
            key={t}
            className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-brand-800"
          >
            {t}
          </span>
        ))}
      </div>
    );
  }

  return (
    <form action={updateCustomerTagsAction} className="space-y-3">
      <input type="hidden" name="customerId" value={customerId} />
      <input type="hidden" name="tab" value="overview" />
      <label htmlFor="customer-tags" className="block text-xs font-semibold uppercase tracking-wide text-ink-400">
        Tags
      </label>
      <input
        id="customer-tags"
        name="tags"
        defaultValue={tags.join(", ")}
        placeholder="vip, recurring, commercial"
        className={input}
      />
      <p className="text-xs text-ink-500">Comma-separated. Used to filter the customer list.</p>
      <FormSubmitButton loadingLabel="Saving…">Save tags</FormSubmitButton>
    </form>
  );
}
