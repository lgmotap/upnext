"use client";

import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";

function sparklineDomain(data: number[]): [number, number] {
  if (data.length === 0) return [0, 1];
  const min = Math.min(...data);
  const max = Math.max(...data);
  const padding = Math.max((max - min) * 0.2, 1);
  return [min - padding, max + padding];
}

export function MiniMetricSparkline({
  data,
  color = "#2563EB",
}: {
  data: number[];
  color?: string;
}) {
  const chartData = data.map((value) => ({ value }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
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
