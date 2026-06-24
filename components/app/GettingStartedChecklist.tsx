"use client";

import Link from "next/link";
import { Check, Circle, ChevronRight } from "lucide-react";
import { Card, CardHeader } from "@/components/app/ui";
import { CopyBookingLink } from "@/components/app/CopyBookingLink";
import type { GettingStartedTask } from "@/server/services/getting-started";

export function GettingStartedChecklist({
  tasks,
  percent,
  bookingUrl,
}: {
  tasks: GettingStartedTask[];
  percent: number;
  bookingUrl: string;
}) {
  if (percent >= 100) return null;

  return (
    <Card className="mb-6">
      <CardHeader
        title="Getting started"
        action={<span className="text-xs font-bold text-brand-700">{percent}% complete</span>}
      />
      <div className="px-5 pb-2">
        <div className="mb-4 h-2 overflow-hidden rounded-full bg-ink-100">
          <div
            className="h-full rounded-full bg-brand-400 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <ul className="divide-y divide-ink-100">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-start gap-3 py-3">
              <span
                className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${
                  task.done ? "bg-brand-400 text-brand-950" : "bg-ink-100 text-ink-400"
                }`}
              >
                {task.done ? <Check className="size-3.5" /> : <Circle className="size-3.5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-950">
                  {task.label}
                  {task.optional && (
                    <span className="ml-1.5 text-xs font-normal text-ink-400">(optional)</span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-ink-500">{task.description}</p>
                {task.id === "booking-link" && !task.done && bookingUrl && (
                  <div className="mt-2">
                    <CopyBookingLink url={bookingUrl} />
                  </div>
                )}
              </div>
              {task.id === "booking-link" ? (
                <Link
                  href={task.href}
                  className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-brand-700 hover:underline"
                >
                  Portals
                  <ChevronRight className="size-3.5" />
                </Link>
              ) : (
                <Link
                  href={task.href}
                  className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-brand-700 hover:underline"
                >
                  {task.done ? "Review" : "Set up"}
                  <ChevronRight className="size-3.5" />
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
