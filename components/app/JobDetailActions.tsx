"use client";

import { useState } from "react";
import { UserPlus, XCircle } from "lucide-react";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { FormSubmitButton } from "@/components/app/FormSubmitButton";
import { Modal } from "@/components/app/Modal";
import { cancelJobAction, markJobCompleteAction, markJobInProgressAction, assignJobAction } from "@/server/actions/jobs";

type Assignable = { id: string; label: string };

export function JobDetailActions({
  jobId,
  status,
  canEdit,
  canAssign,
  assignable,
  currentAssigneeId,
}: {
  jobId: string;
  status: string;
  canEdit: boolean;
  canAssign: boolean;
  assignable: Assignable[];
  currentAssigneeId?: string;
}) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  if (!canEdit || status === "completed" || status === "cancelled") return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {canAssign && assignable.length > 0 && (
          <button
            type="button"
            onClick={() => setAssignOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold ring-1 ring-ink-200 text-ink-800 hover:ring-brand-400"
          >
            <UserPlus className="size-4" /> Assign
          </button>
        )}
        {status === "scheduled" && (
          <form action={markJobInProgressAction}>
            <input type="hidden" name="jobId" value={jobId} />
            <FormSubmitButton variant="outline" loadingLabel="Starting…">
              Start job
            </FormSubmitButton>
          </form>
        )}
        <form action={markJobCompleteAction}>
          <input type="hidden" name="jobId" value={jobId} />
          <FormSubmitButton loadingLabel="Completing…">Mark complete</FormSubmitButton>
        </form>
        <button
          type="button"
          onClick={() => setCancelOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50"
        >
          <XCircle className="size-4" /> Cancel job
        </button>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel this job?"
        description="The job will be marked cancelled. Payment and schedule entries remain for your records."
        confirmLabel="Cancel job"
        tone="danger"
        formAction={cancelJobAction}
        hiddenFields={{ jobId }}
      />

      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title="Assign team member">
        <form action={assignJobAction} className="space-y-4">
          <input type="hidden" name="jobId" value={jobId} />
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">
              Team member
            </label>
            <select
              name="membershipId"
              defaultValue={currentAssigneeId ?? ""}
              required
              className="w-full rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-ink-200"
            >
              <option value="" disabled>
                Select…
              </option>
              {assignable.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAssignOpen(false)}
              className="rounded-full px-4 py-2 text-sm font-semibold text-ink-600 ring-1 ring-ink-200"
            >
              Close
            </button>
            <FormSubmitButton loadingLabel="Assigning…">Save assignment</FormSubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
