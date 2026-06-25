import type { BookingFormField } from "@/generated/prisma/client";

export function CustomBookingFields({ fields }: { fields: BookingFormField[] }) {
  if (fields.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-ink-950">Additional information</h3>
      {fields.map((field) => {
        const name = `custom_${field.key}`;
        const options = Array.isArray(field.optionsJson)
          ? (field.optionsJson as string[])
          : [];

        if (field.fieldType === "textarea") {
          return (
            <label key={field.id} className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                {field.label}
                {field.required ? " *" : ""}
              </span>
              <textarea
                name={name}
                required={field.required}
                rows={3}
                className="mt-1 w-full rounded-xl bg-white px-3.5 py-2.5 text-sm ring-1 ring-ink-200"
              />
            </label>
          );
        }

        if (field.fieldType === "select") {
          return (
            <label key={field.id} className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                {field.label}
                {field.required ? " *" : ""}
              </span>
              <select
                name={name}
                required={field.required}
                defaultValue=""
                className="mt-1 w-full rounded-xl bg-white px-3.5 py-2.5 text-sm ring-1 ring-ink-200"
              >
                <option value="" disabled>
                  Select…
                </option>
                {options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
          );
        }

        if (field.fieldType === "checkbox") {
          return (
            <label key={field.id} className="flex items-center gap-2 rounded-xl bg-ink-50 px-3 py-2.5">
              <input type="checkbox" name={name} className="size-4 rounded border-ink-300" />
              <span className="text-sm font-medium text-ink-800">{field.label}</span>
            </label>
          );
        }

        return (
          <label key={field.id} className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">
              {field.label}
              {field.required ? " *" : ""}
            </span>
            <input
              type="text"
              name={name}
              required={field.required}
              className="mt-1 w-full rounded-xl bg-white px-3.5 py-2.5 text-sm ring-1 ring-ink-200"
            />
          </label>
        );
      })}
    </div>
  );
}
