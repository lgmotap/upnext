"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronDown } from "lucide-react";

export function DashboardDateRangeSelect({
  fromYmd,
  toYmd,
  presets,
  fromParam = "from",
  toParam = "to",
  ariaLabel = "Date range",
  compact = false,
}: {
  fromYmd: string;
  toYmd: string;
  presets: ReadonlyArray<{ label: string; fromYmd: string; toYmd: string }>;
  fromParam?: string;
  toParam?: string;
  ariaLabel?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const value = presets.find((p) => p.fromYmd === fromYmd && p.toYmd === toYmd)?.label ?? "Custom range";

  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{ariaLabel}</span>
      <CalendarDays
        className={`pointer-events-none absolute text-[#7B8494] ${compact ? "left-2.5 size-3.5" : "left-3 size-4"}`}
      />
      <select
        value={value}
        onChange={(e) => {
          const preset = presets.find((p) => p.label === e.target.value);
          if (!preset) return;
          const params = new URLSearchParams(searchParams.toString());
          params.set(fromParam, preset.fromYmd);
          params.set(toParam, preset.toYmd);
          const qs = params.toString();
          router.push(qs ? `/app/dashboard?${qs}` : "/app/dashboard", { scroll: false });
        }}
        className={
          compact
            ? "h-8 appearance-none rounded-lg border border-[#E6EAF0] bg-[#FAFBFC] py-0 pl-8 pr-7 text-xs font-medium text-[#526071] shadow-none focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15"
            : "h-9 appearance-none rounded-[10px] border border-[#E6EAF0] bg-white py-0 pl-9 pr-8 text-sm font-medium text-[#0B1F3A] shadow-sm focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
        }
      >
        {presets.map((p) => (
          <option key={p.label} value={p.label}>
            {p.label}
          </option>
        ))}
        {value === "Custom range" ? <option value="Custom range">Custom range</option> : null}
      </select>
      <ChevronDown
        className={`pointer-events-none absolute text-[#7B8494] ${compact ? "right-2 size-3.5" : "right-2.5 size-4"}`}
      />
    </label>
  );
}
