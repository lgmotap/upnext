import { Repeat } from "lucide-react";
import { frequencyLabel } from "@/lib/booking/frequency";
import { formatDisplayDateTime } from "@/lib/datetime/timezone";
import type { JobSeriesStatus } from "@/generated/prisma/client";
import {
  pauseJobSeriesAction,
  resumeJobSeriesAction,
  cancelJobSeriesAction,
} from "@/server/actions/job-series";

type SeriesProps = {
  seriesId: string;
  jobId: string;
  frequency: string;
  status: JobSeriesStatus;
  nextOccurrenceAt: Date;
  timeZone: string;
  canEdit: boolean;
};

export function JobSeriesPanel({
  seriesId,
  jobId,
  frequency,
  status,
  nextOccurrenceAt,
  timeZone,
  canEdit,
}: SeriesProps) {
  const nextLabel = formatDisplayDateTime(nextOccurrenceAt, timeZone);

  return (
    <div className="rounded-xl bg-brand-50 px-4 py-3 ring-1 ring-brand-200">
      <div className="flex items-start gap-2">
        <Repeat className="mt-0.5 size-4 shrink-0 text-brand-700" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink-950">Recurring schedule</p>
          <p className="mt-0.5 text-sm text-ink-600">
            {frequencyLabel(frequency)} ·{" "}
            <span className="capitalize">{status}</span>
          </p>
          {status === "active" && (
            <p className="mt-1 text-xs text-ink-500">Next visit: {nextLabel}</p>
          )}
          {status === "paused" && (
            <p className="mt-1 text-xs text-amber-700">Auto-scheduling paused — resume to continue.</p>
          )}
          {status === "cancelled" && (
            <p className="mt-1 text-xs text-ink-500">This recurring schedule was cancelled.</p>
          )}
        </div>
      </div>
      {canEdit && status !== "cancelled" && (
        <div className="mt-3 flex flex-wrap gap-2">
          {status === "active" && (
            <form action={pauseJobSeriesAction}>
              <input type="hidden" name="seriesId" value={seriesId} />
              <input type="hidden" name="jobId" value={jobId} />
              <button
                type="submit"
                className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50"
              >
                Pause series
              </button>
            </form>
          )}
          {status === "paused" && (
            <form action={resumeJobSeriesAction}>
              <input type="hidden" name="seriesId" value={seriesId} />
              <input type="hidden" name="jobId" value={jobId} />
              <button
                type="submit"
                className="rounded-full bg-brand-400 px-3 py-1.5 text-xs font-bold text-brand-950 hover:bg-brand-600"
              >
                Resume series
              </button>
            </form>
          )}
          <form action={cancelJobSeriesAction}>
            <input type="hidden" name="seriesId" value={seriesId} />
            <input type="hidden" name="jobId" value={jobId} />
            <button
              type="submit"
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50"
            >
              Cancel series
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
