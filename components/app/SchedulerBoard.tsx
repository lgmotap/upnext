"use client";

import { Fragment, useTransition } from "react";
import Link from "next/link";
import { rescheduleJobFromSchedulerAction } from "@/server/actions/scheduler";

export type SchedulerJobChip = {
  id: string;
  customerName: string;
  serviceName: string;
  timeHm: string;
  hour: number;
  membershipId: string | null;
  status: string;
};

export type SchedulerWorker = {
  id: string;
  label: string;
};

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7);

function hourLabel(h: number): string {
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:00 ${suffix}`;
}

function timeForHour(h: number): string {
  return `${String(h).padStart(2, "0")}:00`;
}

export function SchedulerBoard({
  date,
  jobs,
  workers,
  unassigned,
  canEdit,
}: {
  date: string;
  jobs: SchedulerJobChip[];
  workers: SchedulerWorker[];
  unassigned: SchedulerJobChip[];
  canEdit: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function submitMove(jobId: string, time: string, membershipId?: string) {
    const fd = new FormData();
    fd.set("jobId", jobId);
    fd.set("date", date);
    fd.set("time", time);
    if (membershipId) fd.set("membershipId", membershipId);
    startTransition(() => {
      void rescheduleJobFromSchedulerAction(fd);
    });
  }

  function onDragStart(e: React.DragEvent, jobId: string) {
    if (!canEdit) return;
    e.dataTransfer.setData("text/jobId", jobId);
    e.dataTransfer.effectAllowed = "move";
  }

  function onDrop(e: React.DragEvent, hour: number, membershipId?: string) {
    if (!canEdit) return;
    e.preventDefault();
    const jobId = e.dataTransfer.getData("text/jobId");
    if (!jobId) return;
    submitMove(jobId, timeForHour(hour), membershipId);
  }

  const columns: { id: string; label: string; membershipId?: string }[] = [
    { id: "unassigned", label: "Unassigned" },
    ...workers.map((w) => ({ id: w.id, label: w.label, membershipId: w.id })),
  ];

  function jobsForColumn(membershipId: string | undefined, hour: number) {
    if (membershipId === undefined) {
      return unassigned.filter((j) => j.hour === hour);
    }
    return jobs.filter((j) => j.membershipId === membershipId && j.hour === hour);
  }

  return (
    <div className="space-y-4">
      {pending && (
        <p className="rounded-xl bg-brand-50 px-3.5 py-2 text-sm text-brand-900 ring-1 ring-brand-100">
          Updating schedule…
        </p>
      )}

      {/* Mobile: read-only list */}
      <div className="space-y-2 md:hidden">
        {[...unassigned, ...jobs]
          .sort((a, b) => a.timeHm.localeCompare(b.timeHm))
          .map((job) => (
            <Link
              key={job.id}
              href={`/app/jobs/${job.id}`}
              className="block rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm"
            >
              <p className="font-semibold text-ink-950">{job.customerName}</p>
              <p className="text-xs text-ink-500">
                {job.timeHm} · {job.serviceName}
              </p>
            </Link>
          ))}
      </div>

      {/* Desktop: drag-drop grid */}
      <div className="hidden overflow-x-auto md:block">
        <div
          className="grid min-w-[720px] gap-px rounded-2xl bg-ink-200 ring-1 ring-ink-200"
          style={{ gridTemplateColumns: `4rem repeat(${columns.length}, minmax(8rem, 1fr))` }}
        >
          <div className="bg-ink-50 p-2 text-xs font-semibold text-ink-500">Time</div>
          {columns.map((col) => (
            <div key={col.id} className="bg-ink-50 p-2 text-center text-xs font-semibold text-ink-700">
              {col.label}
            </div>
          ))}

          {HOURS.map((hour) => (
            <Fragment key={hour}>
              <div className="bg-white p-2 text-[11px] font-medium text-ink-500">{hourLabel(hour)}</div>
              {columns.map((col) => {
                const colJobs = jobsForColumn(col.membershipId, hour);
                return (
                  <div
                    key={`${col.id}-${hour}`}
                    className="min-h-[3.5rem] bg-white p-1"
                    onDragOver={(e) => canEdit && e.preventDefault()}
                    onDrop={(e) => onDrop(e, hour, col.membershipId)}
                  >
                    {colJobs.map((job) => (
                      <div
                        key={job.id}
                        draggable={canEdit}
                        onDragStart={(e) => onDragStart(e, job.id)}
                        className="mb-1 cursor-grab rounded-lg border border-brand-200 bg-brand-50 px-2 py-1.5 text-left active:cursor-grabbing"
                      >
                        <Link href={`/app/jobs/${job.id}`} className="block">
                          <p className="truncate text-[11px] font-bold text-brand-900">{job.customerName}</p>
                          <p className="truncate text-[10px] text-brand-700">{job.serviceName}</p>
                        </Link>
                      </div>
                    ))}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      {unassigned.length > 0 && (
        <aside className="rounded-2xl bg-ink-50 p-4 ring-1 ring-ink-100">
          <p className="mb-2 text-sm font-bold text-ink-950">Unassigned ({unassigned.length})</p>
          <p className="mb-3 text-xs text-ink-500">Drag jobs onto a worker column to assign and reschedule.</p>
          <div className="flex flex-wrap gap-2">
            {unassigned.map((job) => (
              <div
                key={job.id}
                draggable={canEdit}
                onDragStart={(e) => onDragStart(e, job.id)}
                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm"
              >
                <p className="font-semibold text-amber-900">{job.customerName}</p>
                <p className="text-xs text-amber-700">
                  {job.timeHm} · {job.serviceName}
                </p>
              </div>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}
