const styles: Record<string, string> = {
  // job
  scheduled: "bg-ink-100 text-ink-600",
  confirmed: "bg-brand-100 text-brand-800",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-brand-100 text-brand-800",
  cancelled: "bg-ink-100 text-ink-500",
  no_show: "bg-rose-100 text-rose-700",
  // booking
  pending: "bg-amber-100 text-amber-700",
  accepted: "bg-brand-100 text-brand-800",
  declined: "bg-rose-100 text-rose-700",
  expired: "bg-ink-100 text-ink-500",
  // payment
  not_requested: "bg-ink-100 text-ink-500",
  paid: "bg-brand-100 text-brand-800",
  overdue: "bg-rose-100 text-rose-700",
  failed: "bg-rose-100 text-rose-700",
  refunded: "bg-ink-100 text-ink-600",
};

const dot: Record<string, string> = {
  scheduled: "bg-ink-400",
  confirmed: "bg-brand-500",
  in_progress: "bg-amber-500",
  completed: "bg-brand-500",
  cancelled: "bg-ink-300",
  no_show: "bg-rose-500",
  pending: "bg-amber-500",
  accepted: "bg-brand-500",
  declined: "bg-rose-500",
  expired: "bg-ink-300",
  not_requested: "bg-ink-300",
  paid: "bg-brand-500",
  overdue: "bg-rose-500",
  failed: "bg-rose-500",
  refunded: "bg-ink-400",
};

export function StatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, " ");
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${styles[status] ?? "bg-ink-100 text-ink-600"}`}
    >
      <span className={`size-1.5 rounded-full ${dot[status] ?? "bg-ink-400"}`} />
      {label}
    </span>
  );
}
