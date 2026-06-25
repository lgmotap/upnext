"use client";

import { useState } from "react";
import { Car, Clock } from "lucide-react";
import { Modal } from "@/components/app/Modal";
import { FormSubmitButton } from "@/components/app/FormSubmitButton";
import { notifyOnTheWayAction, notifyRunningLateAction } from "@/server/actions/scheduling";

export function CrewStatusActions({
  jobId,
  status,
  isSameDay = false,
  disabled,
}: {
  jobId: string;
  status: string;
  isSameDay?: boolean;
  disabled?: boolean;
}) {
  const [lateOpen, setLateOpen] = useState(false);
  const [customEta, setCustomEta] = useState(false);

  if (disabled || status === "completed" || status === "cancelled") return null;

  return (
    <>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <form action={notifyOnTheWayAction}>
          <input type="hidden" name="jobId" value={jobId} />
          <FormSubmitButton
            variant="outline"
            loadingLabel="Sending…"
            className="w-full !rounded-2xl !py-3"
          >
            <Car className="size-4" /> On the way
          </FormSubmitButton>
        </form>
        <button
          type="button"
          onClick={() => setLateOpen(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-amber-800 ring-1 ring-amber-200 hover:bg-amber-50"
        >
          <Clock className="size-4" /> Running late
        </button>
      </div>

      <Modal open={lateOpen} onClose={() => setLateOpen(false)} title="Notify customer — running late">
        <form action={notifyRunningLateAction} className="space-y-4">
          <input type="hidden" name="jobId" value={jobId} />
          <p className="text-sm text-ink-600">
            {isSameDay
              ? "Same-day visit — include an ETA so the customer knows when to expect you."
              : "Sends a quick email so the customer knows you are behind schedule."}
          </p>
          {isSameDay ? (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">
                ETA (minutes)
              </label>
              {!customEta ? (
                <select
                  name="etaMinutes"
                  defaultValue="15"
                  className="w-full rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-ink-200"
                  onChange={(e) => setCustomEta(e.target.value === "custom")}
                >
                  <option value="15">About 15 minutes</option>
                  <option value="30">About 30 minutes</option>
                  <option value="45">About 45 minutes</option>
                  <option value="custom">Custom…</option>
                </select>
              ) : (
                <input
                  type="number"
                  name="etaMinutes"
                  min={5}
                  max={180}
                  defaultValue={60}
                  placeholder="Minutes late"
                  className="w-full rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-ink-200"
                />
              )}
            </div>
          ) : (
            <input type="hidden" name="etaMinutes" value="" />
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setLateOpen(false)}
              className="rounded-full px-4 py-2 text-sm font-semibold text-ink-600 ring-1 ring-ink-200"
            >
              Cancel
            </button>
            <FormSubmitButton loadingLabel="Sending…">Notify customer</FormSubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
