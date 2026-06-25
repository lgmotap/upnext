import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { ScheduleConflictOverlap } from "@/lib/scheduling/conflicts";

const statusColor: Record<string, string> = {
  in_progress: "border-amber-400 bg-amber-50 text-amber-800",
  confirmed: "border-brand-400 bg-brand-50 text-brand-800",
  scheduled: "border-ink-300 bg-ink-50 text-ink-700",
  completed: "border-brand-500 bg-brand-100 text-brand-800",
};

export function CalendarJobChip({
  jobId,
  timeLabel,
  customerName,
  serviceName,
  status,
  conflicts,
}: {
  jobId: string;
  timeLabel: string;
  customerName: string;
  serviceName: string;
  status: string;
  conflicts?: ScheduleConflictOverlap[];
}) {
  const conflictTitle =
    conflicts && conflicts.length > 0
      ? `Overlaps with ${conflicts.map((c) => c.customerLabel).join(", ")}`
      : undefined;

  return (
    <Link
      href={`/app/jobs/${jobId}`}
      title={conflictTitle}
      className={`block rounded-lg border-l-2 px-2.5 py-2 text-left transition hover:shadow-soft ${
        statusColor[status] ?? statusColor.scheduled
      } ${conflicts?.length ? "ring-1 ring-amber-300" : ""}`}
    >
      <p className="flex items-center gap-1 text-[11px] font-bold">
        {conflicts && conflicts.length > 0 && (
          <AlertTriangle className="size-3 shrink-0 text-amber-600" aria-hidden />
        )}
        <span>{timeLabel}</span>
      </p>
      <p className="truncate text-xs font-semibold">{customerName}</p>
      <p className="truncate text-[11px] opacity-70">{serviceName}</p>
      {conflictTitle && (
        <p className="mt-0.5 truncate text-[10px] font-medium text-amber-700">{conflictTitle}</p>
      )}
    </Link>
  );
}

export function CalendarPendingChip({
  bookingRequestId,
  timeLabel,
  customerName,
  serviceName,
}: {
  bookingRequestId: string;
  timeLabel: string;
  customerName: string;
  serviceName: string;
}) {
  return (
    <Link
      href={`/app/bookings/${bookingRequestId}`}
      className="block rounded-lg border border-dashed border-amber-300 bg-amber-50/80 px-2.5 py-2 text-left transition hover:bg-amber-50"
    >
      <p className="text-[11px] font-bold text-amber-800">{timeLabel} · Pending</p>
      <p className="truncate text-xs font-semibold text-amber-900">{customerName}</p>
      <p className="truncate text-[11px] text-amber-700/80">{serviceName}</p>
    </Link>
  );
}
