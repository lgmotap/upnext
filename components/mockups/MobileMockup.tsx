import { MapPin, Clock, StickyNote, CheckCircle2, Wifi, Signal, BatteryFull, ChevronRight } from "lucide-react";

const checklist = [
  { task: "Kitchen — counters & appliances", done: true },
  { task: "Bathrooms — full clean", done: true },
  { task: "Bedrooms — vacuum & dust", done: false },
  { task: "Windows — interior only", done: false },
];

/**
 * Realistic phone mockup at ~9:19.5 aspect ratio with frame, side buttons,
 * status bar, punch-hole camera, and home indicator.
 */
export function MobileMockup({ className = "" }: { className?: string }) {
  return (
    <div className={`w-[270px] ${className}`}>
      {/* frame */}
      <div
        className="relative aspect-[9/19.3] w-full rounded-[2.9rem] bg-ink-950 p-[8px] shadow-float ring-1 ring-ink-800"
        role="img"
        aria-label="UpNext mobile app on a phone, showing a cleaner's job for today with checklist, customer note, and mark complete button"
      >
        {/* side buttons */}
        <div className="absolute -left-[3px] top-24 h-8 w-[3px] rounded-l-md bg-ink-800" />
        <div className="absolute -left-[3px] top-36 h-12 w-[3px] rounded-l-md bg-ink-800" />
        <div className="absolute -left-[3px] top-52 h-12 w-[3px] rounded-l-md bg-ink-800" />
        <div className="absolute -right-[3px] top-32 h-16 w-[3px] rounded-r-md bg-ink-800" />
        {/* screen */}
        <div className="relative flex h-full flex-col overflow-hidden rounded-[2.4rem] bg-ink-50">
          {/* header */}
          <div className="bg-brand-600 px-5 pb-4 pt-2.5 text-white">
            {/* status bar */}
            <div className="mb-3 flex items-center justify-between text-[10px] font-semibold">
              <span>9:41</span>
              {/* punch-hole camera */}
              <span className="absolute left-1/2 top-2.5 size-3.5 -translate-x-1/2 rounded-full bg-ink-950 ring-2 ring-ink-900" />
              <span className="flex items-center gap-1">
                <Signal className="size-3" aria-hidden />
                <Wifi className="size-3" aria-hidden />
                <BatteryFull className="size-3.5" aria-hidden />
              </span>
            </div>
            <p className="text-[10px] font-medium text-brand-100">Today · 2 of 4 jobs done</p>
            <p className="text-[16px] font-bold leading-snug">Harper Residence</p>
            <div className="mt-1.5 flex items-center gap-3 text-[9px] text-brand-100">
              <span className="flex items-center gap-1">
                <Clock className="size-3" aria-hidden /> 1:30 – 3:30 PM
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="size-3" aria-hidden /> 12 Oak St.
              </span>
            </div>
            {/* progress */}
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-brand-800/60">
              <div className="h-full w-1/2 rounded-full bg-white/90" />
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-2.5 p-3.5">
            {/* checklist */}
            <div className="rounded-2xl bg-white p-3 shadow-soft ring-1 ring-ink-100">
              <p className="mb-2 text-[10px] font-bold text-ink-900">Job checklist</p>
              <div className="space-y-2">
                {checklist.map((c) => (
                  <div key={c.task} className="flex items-center gap-2">
                    <span
                      className={`flex size-4 shrink-0 items-center justify-center rounded-full ${
                        c.done ? "bg-brand-500" : "bg-white ring-1 ring-ink-300"
                      }`}
                    >
                      {c.done && (
                        <svg viewBox="0 0 10 10" className="size-2.5 text-white" fill="none">
                          <path d="M2 5.5 L4 7.5 L8 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <p className={`text-[9.5px] ${c.done ? "text-ink-400 line-through" : "font-medium text-ink-800"}`}>
                      {c.task}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* notes */}
            <div className="rounded-2xl bg-amber-50 p-3 ring-1 ring-amber-100">
              <p className="mb-0.5 flex items-center gap-1 text-[10px] font-bold text-amber-800">
                <StickyNote className="size-3" aria-hidden /> Customer note
              </p>
              <p className="text-[9.5px] leading-snug text-amber-900/80">
                Spare key under the planter. Please skip the office — dog is friendly!
              </p>
            </div>

            {/* up next */}
            <div className="flex items-center gap-2 rounded-2xl bg-white p-3 shadow-soft ring-1 ring-ink-100">
              <span className="h-7 w-1 rounded-full bg-violet-400" />
              <div className="min-w-0 flex-1">
                <p className="text-[8.5px] font-semibold text-ink-400">UP NEXT · 4:00 PM</p>
                <p className="truncate text-[10px] font-bold text-ink-900">Nguyen Family — Recurring</p>
              </div>
              <ChevronRight className="size-3.5 shrink-0 text-ink-300" aria-hidden />
            </div>

            {/* CTA pinned to bottom */}
            <div className="mt-auto">
              <button
                type="button"
                tabIndex={-1}
                className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-brand-600 py-3 text-[11px] font-bold text-white shadow-md"
              >
                <CheckCircle2 className="size-4" aria-hidden /> Mark job complete
              </button>
              {/* home indicator */}
              <div className="mx-auto mt-2.5 h-1 w-24 rounded-full bg-ink-300" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
