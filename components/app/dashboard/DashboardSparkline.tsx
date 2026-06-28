"use client";

import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";

export type DashboardSparklineProps = {
  data: number[];
  color?: string;
};

function sparklineDomain(data: number[]): [number, number] {
  if (data.length === 0) return [0, 1];
  const min = Math.min(...data);
  const max = Math.max(...data);
  const padding = Math.max((max - min) * 0.25, 1);
  return [min - padding, max + padding];
}

/** Decorative KPI sparkline — quiet context only. */
export function DashboardSparkline({ data, color = "#52688F" }: DashboardSparklineProps) {
  const chartData = data.map((value) => ({ value }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <YAxis hide domain={sparklineDomain(data)} />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          strokeOpacity={0.85}
          dot={false}
          activeDot={false}
          isAnimationActive={false}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
