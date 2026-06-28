export function DashboardChangeBadge({ pct }: { pct: number | null }) {
  if (pct === null) return null;
  const up = pct >= 0;
  return (
    <span className={`text-xs font-semibold ${up ? "text-emerald-700" : "text-rose-600"}`}>
      {up ? "+" : ""}
      {pct}% vs prior period
    </span>
  );
}

export function DashboardMetricCell({
  label,
  value,
  changePct,
}: {
  label: string;
  value: string;
  changePct: number | null;
}) {
  return (
    <div className="rounded-xl bg-ink-50 p-4 ring-1 ring-ink-100">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink-950">{value}</p>
      <div className="mt-1">
        <DashboardChangeBadge pct={changePct} />
      </div>
    </div>
  );
}
