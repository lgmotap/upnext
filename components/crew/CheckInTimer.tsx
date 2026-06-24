"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { formatElapsedDuration } from "@/lib/datetime/duration";

type CheckInTimerProps = {
  checkedInAt: string;
  completedAt?: string | null;
};

export function CheckInTimer({ checkedInAt, completedAt }: CheckInTimerProps) {
  const startMs = new Date(checkedInAt).getTime();
  const endMs = completedAt ? new Date(completedAt).getTime() : null;
  const isRunning = endMs === null;

  const [elapsed, setElapsed] = useState(() =>
    formatElapsedDuration((endMs ?? Date.now()) - startMs),
  );

  useEffect(() => {
    if (endMs !== null) return;
    const tick = () => setElapsed(formatElapsedDuration(Date.now() - startMs));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startMs, endMs]);

  return (
    <div
      className={`mt-4 rounded-2xl px-4 py-4 ring-1 ${
        isRunning ? "bg-brand-50 ring-brand-200" : "bg-ink-50 ring-ink-100"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-700">
          <Timer className={`size-4 ${isRunning ? "text-brand-700" : "text-ink-400"}`} />
          {isRunning ? "On site" : "Time on site"}
        </div>
        <span
          className={`font-mono text-2xl font-bold tabular-nums ${
            isRunning ? "text-brand-900" : "text-ink-700"
          }`}
          aria-live="polite"
        >
          {elapsed}
        </span>
      </div>
    </div>
  );
}
