import { Check } from "lucide-react";
import { toggleJobChecklistItemAction } from "@/server/actions/checklists";

type ChecklistItem = {
  id: string;
  label: string;
  isCompleted: boolean;
};

type JobChecklistProps = {
  jobId: string;
  items: ChecklistItem[];
  readOnly?: boolean;
};

export function JobChecklist({ jobId, items, readOnly = false }: JobChecklistProps) {
  if (items.length === 0) return null;

  const doneCount = items.filter((item) => item.isCompleted).length;

  return (
    <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-ink-100 shadow-soft">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-ink-950">Job checklist</h2>
        <span className="text-xs font-semibold text-ink-500">
          {doneCount}/{items.length} done
        </span>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            {readOnly ? (
              <div className="flex items-start gap-3 rounded-xl px-2 py-2">
                <span
                  className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md ring-1 ${
                    item.isCompleted
                      ? "bg-brand-400 text-brand-950 ring-brand-400"
                      : "bg-white text-transparent ring-ink-200"
                  }`}
                >
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                <span
                  className={`text-sm ${item.isCompleted ? "text-ink-500 line-through" : "text-ink-800"}`}
                >
                  {item.label}
                </span>
              </div>
            ) : (
              <form action={toggleJobChecklistItemAction}>
                <input type="hidden" name="jobId" value={jobId} />
                <input type="hidden" name="itemId" value={item.id} />
                <input type="hidden" name="completed" value={item.isCompleted ? "false" : "true"} />
                <button
                  type="submit"
                  className="flex w-full items-start gap-3 rounded-xl px-2 py-2 text-left hover:bg-ink-50"
                >
                  <span
                    className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md ring-1 ${
                      item.isCompleted
                        ? "bg-brand-400 text-brand-950 ring-brand-400"
                        : "bg-white text-transparent ring-ink-200"
                    }`}
                  >
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                  <span
                    className={`text-sm ${item.isCompleted ? "text-ink-500 line-through" : "text-ink-800"}`}
                  >
                    {item.label}
                  </span>
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
