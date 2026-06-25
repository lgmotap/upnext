import type { BookingFormField } from "@/generated/prisma/client";

export function CustomFieldsDisplay({
  fields,
  values,
}: {
  fields: Pick<BookingFormField, "key" | "label" | "fieldType">[];
  values: Record<string, unknown> | null | undefined;
}) {
  if (!values || typeof values !== "object") return null;
  const entries = fields
    .map((field) => {
      const raw = values[field.key];
      if (raw === undefined || raw === "") return null;
      const display =
        field.fieldType === "checkbox" ? (raw === true || raw === "true" ? "Yes" : "No") : String(raw);
      return { label: field.label, display };
    })
    .filter(Boolean) as { label: string; display: string }[];

  if (entries.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Additional information</p>
      <ul className="space-y-1.5">
        {entries.map((entry) => (
          <li key={entry.label} className="rounded-lg bg-ink-50 px-3 py-2 text-sm">
            <span className="font-medium text-ink-800">{entry.label}: </span>
            <span className="text-ink-600">{entry.display}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
