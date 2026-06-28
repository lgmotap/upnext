"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney } from "@/lib/money/format";

export type RevenuePoint = {
  label: string;
  revenue: number;
};

function formatCurrencyTick(cents: number): string {
  if (cents === 0) return "$0";
  const dollars = cents / 100;
  if (dollars >= 1000) {
    return `$${(dollars / 1000).toFixed(dollars % 1000 === 0 ? 0 : 1)}K`;
  }
  return `$${Math.round(dollars)}`;
}

function GrossRevenueTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ value?: unknown }>;
  label?: string;
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  const cents = Number(payload[0]?.value ?? 0);

  return (
    <div className="rounded-lg border border-[#E6EAF0] bg-white px-3 py-2 shadow-lg">
      <div className="text-xs font-medium text-[#7B8494]">{label}</div>
      <div className="text-sm font-semibold text-[#0B1F3A]">{formatMoney(cents, currency)}</div>
    </div>
  );
}

export function GrossRevenueChart({
  data,
  currency,
  ariaLabel,
}: {
  data: RevenuePoint[];
  currency: string;
  ariaLabel?: string;
}) {
  const gradientId = useId().replace(/:/g, "");

  return (
    <div className="h-[270px] w-full min-w-0" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 18, right: 18, bottom: 8, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity={0.16} />
              <stop offset="75%" stopColor="#2563EB" stopOpacity={0.04} />
              <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid vertical={false} stroke="#E6EAF0" strokeDasharray="4 4" />

          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#7B8494", fontSize: 12 }}
            interval="preserveStartEnd"
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#7B8494", fontSize: 12 }}
            tickFormatter={formatCurrencyTick}
            width={48}
            domain={[0, (dataMax: number) => dataMax + Math.max(300, Math.round(dataMax * 0.08))]}
          />

          <Tooltip
            cursor={{ stroke: "#CBD5E1", strokeDasharray: "4 4" }}
            content={(props) => (
              <GrossRevenueTooltip
                active={props.active}
                payload={props.payload}
                label={typeof props.label === "string" ? props.label : undefined}
                currency={currency}
              />
            )}
          />

          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#2563EB"
            strokeWidth={3}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{
              r: 4,
              fill: "#FFFFFF",
              stroke: "#2563EB",
              strokeWidth: 2,
            }}
            isAnimationActive={false}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
