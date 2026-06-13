/** "Before" and "after" visuals used inside the comparison sliders. */

const rows = [
  ["Hendersn, Kate", "tue??", "deep clean", "PAID??"],
  ["Lakeside offc", "3/14", "comercial", "$420 pend"],
  ["nguyen", "every 2wk", "recur", "cash"],
  ["oak st rental", "FRI", "moveout", "OVERDUE"],
  ["Mr Patel", "??", "carpet", "paid i think"],
];

const smsThread = [
  { from: "them", text: "Hi! Can we move Friday's clean to Saturday instead?" },
  { from: "them", text: "Also — did you get my e-transfer? 😊" },
  { from: "me", text: "So sorry, just seeing this now!! Which Friday did you mean?" },
  { from: "them", text: "...the one that was yesterday 😕" },
];

/**
 * "Before" collage: jobs in a spreadsheet, customers texting, missed calls,
 * payments chased over the phone, reminders on paper scraps.
 */
export function ManualTrackingMock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative ${className}`}
      role="img"
      aria-label="Scattered manual tools: a messy spreadsheet, an unanswered text thread, missed call notifications, and sticky note reminders"
    >
      <div className="grid grid-cols-[1.1fr_1fr] items-start gap-3 sm:gap-4">
        {/* left column: spreadsheet + missed calls */}
        <div className="space-y-3">
          <div className="-rotate-1 overflow-hidden rounded-xl bg-white ring-1 ring-ink-200 shadow-soft">
            <div className="flex items-center gap-1.5 border-b border-ink-200 bg-ink-100 px-3 py-1.5">
              <span className="size-2 rounded-full bg-ink-300" />
              <span className="size-2 rounded-full bg-ink-300" />
              <span className="truncate text-[9px] font-semibold text-ink-500">jobs_FINAL_v7_USE-THIS-ONE.xlsx</span>
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {["CUSTOMER", "date", "Service", "$$$"].map((h) => (
                    <th key={h} className="border border-ink-200 bg-ink-50 px-1.5 py-1 text-left text-[8px] font-bold text-ink-600">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, ri) => (
                  <tr key={ri}>
                    {r.map((c, ci) => (
                      <td
                        key={ci}
                        className={`border border-ink-200 px-1.5 py-1 text-[8px] text-ink-700 ${
                          (ri * 5 + ci) % 4 === 0 ? "bg-yellow-100" : ""
                        } ${ri === 3 && ci === 3 ? "bg-rose-100 font-bold text-rose-700" : ""}`}
                      >
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* missed call notifications */}
          <div className="rotate-1 space-y-1.5">
            {[
              { who: "Lakeside Offices", what: "Missed call (2) · Voicemail 0:48 — “…about the keys for…”" },
              { who: "Kate Henderson", what: "Missed call · yesterday, 4:12 PM" },
            ].map((c) => (
              <div key={c.who} className="flex items-start gap-2 rounded-xl bg-white p-2.5 ring-1 ring-ink-200 shadow-soft">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-rose-100">
                  <svg viewBox="0 0 16 16" className="size-3 text-rose-600" fill="none" aria-hidden>
                    <path d="M3 3 c0 6 4 10 10 10 l1-3 -3-1 -1 1.5 c-2-.8 -3.7-2.5 -4.5-4.5 L7 5 6 2 Z" fill="currentColor" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold text-ink-900">{c.who}</p>
                  <p className="truncate text-[8px] text-ink-500">{c.what}</p>
                </div>
                <span className="ml-auto rounded-full bg-rose-50 px-1.5 py-0.5 text-[7px] font-bold text-rose-600">
                  CALL BACK
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* right column: SMS thread */}
        <div className="rotate-1 overflow-hidden rounded-2xl bg-white ring-1 ring-ink-200 shadow-soft">
          <div className="flex items-center gap-2 border-b border-ink-100 bg-ink-50 px-3 py-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-ink-200 text-[8px] font-bold text-ink-600">
              KH
            </span>
            <div>
              <p className="text-[9px] font-bold text-ink-900">Kate H. (customer)</p>
              <p className="text-[7.5px] text-ink-400">Text message</p>
            </div>
          </div>
          <div className="space-y-1.5 p-2.5">
            {smsThread.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-2.5 py-1.5 text-[8.5px] leading-snug ${
                  m.from === "me"
                    ? "ml-auto rounded-br-sm bg-sky-500 text-white"
                    : "rounded-bl-sm bg-ink-100 text-ink-800"
                }`}
              >
                {m.text}
              </div>
            ))}
            <p className="pt-0.5 text-right text-[7px] font-medium text-ink-400">Replied 2 days late</p>
          </div>
        </div>
      </div>

      {/* paper scraps on top */}
      <div className="absolute -right-3 -top-4 w-28 -rotate-6 rounded-md bg-yellow-200 p-2 shadow-md">
        <p className="font-hand text-[13px] leading-tight text-yellow-900">send Patel quote!! (from last week)</p>
      </div>
      <div className="absolute -bottom-2 right-10 w-28 rotate-3 rounded-md bg-rose-200 p-2 shadow-md">
        <p className="font-hand text-[13px] leading-tight text-rose-900">who&apos;s paid?? check bank app</p>
      </div>
    </div>
  );
}

/**
 * "After" counterpart to ManualTrackingMock: the same jobs, payments, and
 * the same customer conversation — but inside one platform window, with
 * confirmations and reminders sending themselves.
 */
export function ManagedPlatformMock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl bg-white ring-1 ring-ink-200/70 shadow-lift ${className}`}
      role="img"
      aria-label="One platform window showing today's jobs and payments next to a customer conversation with automatic reminders and receipts"
    >
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-ink-100 bg-ink-50/60 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-rose-300" />
        <span className="size-2.5 rounded-full bg-amber-300" />
        <span className="size-2.5 rounded-full bg-emerald-300" />
        <div className="mx-auto flex h-5 w-44 items-center justify-center rounded-md bg-white text-[9px] text-ink-400 ring-1 ring-ink-100">
          app.upnext.com/inbox
        </div>
      </div>

      <div className="grid grid-cols-[1.1fr_1fr] gap-3 p-3 sm:gap-4 sm:p-4">
        {/* left: jobs + payments */}
        <div className="space-y-3">
          <div className="rounded-xl ring-1 ring-ink-100 p-2.5">
            <p className="mb-2 text-[9px] font-bold text-ink-900">Today&apos;s jobs</p>
            <div className="space-y-1.5">
              {[
                { client: "Harper Residence", info: "8:30 · Maya R.", status: "In progress", cls: "bg-amber-50 text-amber-700", bar: "bg-brand-500" },
                { client: "Lakeside Offices", info: "10:00 · Team A · Keys: front desk", status: "Scheduled", cls: "bg-ink-100 text-ink-600", bar: "bg-sky-500" },
                { client: "Oak St. Rental", info: "3:00 · Maya R.", status: "Paid", cls: "bg-emerald-50 text-emerald-700", bar: "bg-rose-400" },
              ].map((j) => (
                <div key={j.client} className="flex items-center gap-2 rounded-lg bg-ink-50/50 px-2 py-1.5">
                  <span className={`h-6 w-1 rounded-full ${j.bar}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[9px] font-semibold text-ink-900">{j.client}</p>
                    <p className="truncate text-[8px] text-ink-500">{j.info}</p>
                  </div>
                  <span className={`rounded-full px-1.5 py-0.5 text-[7px] font-bold ${j.cls}`}>{j.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl ring-1 ring-ink-100 p-2.5">
            <p className="mb-2 text-[9px] font-bold text-ink-900">Payments</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-2 py-1.5">
                <p className="text-[8.5px] font-semibold text-emerald-800">Lakeside Offices — $420</p>
                <p className="text-[7.5px] font-bold text-emerald-600">Paid online today ✓</p>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-ink-50 px-2 py-1.5">
                <p className="text-[8.5px] font-semibold text-ink-700">Raj Patel — $280</p>
                <p className="text-[7.5px] font-bold text-brand-700">Reminder scheduled · auto</p>
              </div>
            </div>
          </div>
        </div>

        {/* right: the same conversation, handled */}
        <div className="flex flex-col rounded-xl ring-1 ring-ink-100">
          <div className="flex items-center gap-2 border-b border-ink-100 bg-ink-50/60 px-2.5 py-2 rounded-t-xl">
            <span className="flex size-6 items-center justify-center rounded-full bg-brand-100 text-[8px] font-bold text-brand-800">
              KH
            </span>
            <div>
              <p className="text-[9px] font-bold text-ink-900">Kate Henderson</p>
              <p className="text-[7.5px] text-ink-400">Recurring · every 2 weeks</p>
            </div>
          </div>
          <div className="flex-1 space-y-1.5 p-2.5">
            <div className="ml-auto max-w-[90%] rounded-2xl rounded-br-sm bg-brand-600 px-2.5 py-1.5 text-[8.5px] leading-snug text-white">
              Reminder: your deep clean is tomorrow at 8:30 AM ✨
            </div>
            <p className="text-right text-[7px] font-semibold text-brand-600">Sent automatically</p>
            <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-ink-100 px-2.5 py-1.5 text-[8.5px] leading-snug text-ink-800">
              Perfect, thank you! 🙌
            </div>
            <div className="ml-auto max-w-[90%] rounded-2xl rounded-br-sm bg-brand-600 px-2.5 py-1.5 text-[8.5px] leading-snug text-white">
              Payment received — receipt sent to your email ✓
            </div>
            <p className="text-right text-[7px] font-semibold text-brand-600">Sent automatically</p>
          </div>
          <div className="border-t border-ink-100 px-2.5 py-2">
            <p className="rounded-lg bg-brand-50 px-2 py-1.5 text-[7.5px] font-semibold text-brand-800">
              Next follow-up scheduled · no chasing needed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Handwritten entries scribbled into a paper week planner. */
const scribbles: Record<string, { text: string; cls: string }[]> = {
  Mon: [
    { text: "Harper 8:30 deep clean", cls: "text-blue-800 -rotate-2" },
    { text: "Lakeside 10??", cls: "text-blue-800 rotate-1 line-through decoration-rose-500 decoration-2" },
    { text: "→ moved to wed?", cls: "text-rose-600 rotate-2" },
  ],
  Tue: [
    { text: "nguyen (recur?)", cls: "text-ink-700 rotate-1" },
    { text: "MAYA OFF!!", cls: "text-rose-600 -rotate-2 text-[15px]" },
    { text: "call patel back", cls: "text-blue-800 rotate-2" },
  ],
  Wed: [
    { text: "Lakeside 10am", cls: "text-blue-800 -rotate-1" },
    { text: "sara windows 10:30??", cls: "text-ink-700 rotate-1" },
    { text: "DOUBLE BOOKED?!", cls: "text-rose-600 -rotate-3 font-bold" },
  ],
  Thu: [
    { text: "greenway office pm", cls: "text-blue-800 rotate-1" },
    { text: "jordan? ask first", cls: "text-ink-600 -rotate-2" },
  ],
  Fri: [
    { text: "oak st MOVE-OUT", cls: "text-blue-800 -rotate-1" },
    { text: "keys???", cls: "text-rose-600 rotate-3 text-[15px]" },
  ],
};

export function MessyCalendarMock({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div
        className="overflow-hidden rounded-xl bg-[#fffdf4] ring-1 ring-ink-200 shadow-soft"
        role="img"
        aria-label="A paper week planner covered in handwritten, crossed-out, and conflicting scheduling notes"
      >
        {/* spiral binding */}
        <div className="flex justify-around border-b border-ink-200/60 bg-[#f7f2e4] px-4 py-1.5">
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} className="size-2 rounded-full bg-white shadow-[inset_0_1px_2px_rgba(11,43,46,0.35)] ring-1 ring-ink-300" />
          ))}
        </div>
        <p className="font-hand pt-2 text-center text-xl font-bold text-ink-800 -rotate-1">
          week of march 10 <span className="text-rose-600">(?)</span>
        </p>
        <div className="grid grid-cols-5 px-2 pb-3 pt-1">
          {(["Mon", "Tue", "Wed", "Thu", "Fri"] as const).map((d, i) => (
            <div key={d} className={`relative min-h-40 px-1.5 py-1 ${i > 0 ? "border-l border-ink-200/70" : ""}`}>
              <p className="font-hand mb-1 border-b border-ink-300/60 pb-0.5 text-center text-[15px] font-bold text-ink-700">
                {d}
              </p>
              <div className="space-y-1.5">
                {scribbles[d].map((s) => (
                  <p key={s.text} className={`font-hand text-[13px] leading-tight ${s.cls}`}>
                    {s.text}
                  </p>
                ))}
              </div>
              {/* hand-drawn circle around the double booking */}
              {d === "Wed" && (
                <span className="pointer-events-none absolute inset-x-0 top-[58%] mx-auto h-10 w-[95%] -rotate-2 rounded-[50%] border-2 border-rose-500/70" />
              )}
            </div>
          ))}
        </div>
        {/* coffee stain */}
        <span className="pointer-events-none absolute bottom-4 right-8 size-12 rounded-full border-[5px] border-amber-800/15" />
        <span className="pointer-events-none absolute bottom-5 right-9 size-10 rounded-full border-2 border-amber-800/10" />
      </div>

      <div className="absolute -right-3 top-10 w-24 rotate-6 rounded-md bg-yellow-200 p-1.5 shadow-md">
        <p className="font-hand text-[13px] leading-tight text-yellow-900">wed = maya dentist, move jobs!!</p>
      </div>
      <div className="absolute -bottom-3 left-6 w-28 -rotate-2 rounded-2xl rounded-bl-sm bg-emerald-500 p-1.5 text-[7.5px] font-medium text-white shadow-md">
        am I working thursday or not?
      </div>
    </div>
  );
}

const cleanEvents = [
  { col: 1, top: 6, h: 26, who: "Maya", label: "Harper — Deep clean", cls: "bg-brand-100 text-brand-900 border-brand-400" },
  { col: 1, top: 38, h: 22, who: "Team A", label: "Lakeside — Commercial", cls: "bg-sky-100 text-sky-900 border-sky-400" },
  { col: 2, top: 10, h: 24, who: "Jordan", label: "Nguyen — Recurring", cls: "bg-violet-100 text-violet-900 border-violet-400" },
  { col: 2, top: 44, h: 20, who: "Maya", label: "Sara B. — Windows", cls: "bg-brand-100 text-brand-900 border-brand-400" },
  { col: 3, top: 6, h: 26, who: "Team A", label: "Greenway — Office", cls: "bg-sky-100 text-sky-900 border-sky-400" },
  { col: 4, top: 14, h: 24, who: "Jordan", label: "Patel — Carpet", cls: "bg-violet-100 text-violet-900 border-violet-400" },
  { col: 4, top: 46, h: 20, who: "Maya", label: "Oak St. — Move-out", cls: "bg-brand-100 text-brand-900 border-brand-400" },
  { col: 5, top: 8, h: 24, who: "Team A", label: "Greenway — Office", cls: "bg-sky-100 text-sky-900 border-sky-400" },
];

export function CleanCalendarMock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-xl bg-white ring-1 ring-ink-200/70 shadow-lift ${className}`}
      role="img"
      aria-label="An organized team calendar with color-coded jobs assigned to team members and a clear open slot"
    >
      <div className="flex items-center justify-between border-b border-ink-100 bg-ink-50/60 px-3 py-1.5">
        <p className="text-[9px] font-bold text-ink-900">Team schedule · Mar 10–14</p>
        <div className="flex gap-1.5">
          {[["Maya", "bg-brand-400"], ["Jordan", "bg-violet-400"], ["Team A", "bg-sky-400"]].map(([n, c]) => (
            <span key={n} className="flex items-center gap-1 text-[7.5px] font-medium text-ink-600">
              <span className={`size-1.5 rounded-full ${c}`} /> {n}
            </span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-5 gap-px bg-ink-100 p-px">
        {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d, i) => (
          <div key={d} className="relative h-44 bg-white">
            <p className="border-b border-ink-100 py-1 text-center text-[8px] font-bold text-ink-500">{d}</p>
            {cleanEvents
              .filter((e) => e.col === i + 1)
              .map((e, j) => (
                <div
                  key={j}
                  style={{ top: `${e.top + 16}%`, height: `${e.h}%` }}
                  className={`absolute inset-x-1 overflow-hidden rounded-md border-l-2 px-1 py-0.5 text-[7px] leading-tight ${e.cls}`}
                >
                  <span className="font-bold">{e.who}</span>
                  <br />
                  {e.label}
                </div>
              ))}
            {i === 2 && (
              <div className="absolute inset-x-1 top-[58%] flex h-[24%] items-center justify-center rounded-md border border-dashed border-brand-300 bg-brand-50/50 text-[7px] font-semibold text-brand-600">
                Open slot
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
