/** "Before" and "after" visuals used inside the comparison sliders. */

const rows = [
  ["Hendersn, Kate", "tue??", "deep clean", "PAID??", "check w/ maya", "done?"],
  ["Lakeside offc", "3/14", "comercial", "$420 pend", "KEYS!!", "??"],
  ["nguyen", "every 2wk", "recur", "cash", "dog!!", "ok"],
  ["oak st rental", "FRI", "moveout", "OVERDUE", "call back", ""],
  ["Mr Patel", "??", "carpet", "paid i think", "re-quote", "no show?"],
  ["sara b.", "3/18", "windows", "$180", "", "done"],
  ["GREENWAY LLC", "mon+thu", "office", "invoice??", "ask jordan", ""],
];

const cellTint = ["", "bg-yellow-100", "", "bg-rose-100", "bg-yellow-100", "bg-orange-100"];

export function SpreadsheetMock({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div
        className="overflow-hidden rounded-xl bg-white ring-1 ring-ink-200 shadow-soft"
        role="img"
        aria-label="A messy spreadsheet with inconsistent job, payment, and customer notes"
      >
        <div className="flex items-center gap-1.5 border-b border-ink-200 bg-ink-100 px-3 py-1.5">
          <span className="size-2 rounded-full bg-ink-300" />
          <span className="size-2 rounded-full bg-ink-300" />
          <span className="text-[9px] font-semibold text-ink-500">jobs_FINAL_v7_USE-THIS-ONE.xlsx</span>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["CUSTOMER", "date", "Service", "$$$", "notes", "status???"].map((h) => (
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
                      (ri * 7 + ci) % 5 === 0 ? cellTint[ci] : ""
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

      {/* scattered sticky notes & chat bubbles */}
      <div className="absolute -right-3 -top-4 w-28 -rotate-6 rounded-md bg-yellow-200 p-2 text-[8px] font-medium text-yellow-900 shadow-md">
        Did anyone confirm Friday move-out??
      </div>
      <div className="absolute -bottom-4 -left-3 w-32 rotate-3 rounded-2xl rounded-bl-sm bg-emerald-500 p-2 text-[8px] font-medium text-white shadow-md">
        hey did the Patel job get paid? can&apos;t find it 😅
      </div>
      <div className="absolute -right-2 bottom-10 w-24 rotate-6 rounded-md bg-rose-200 p-2 text-[8px] font-semibold text-rose-900 shadow-md">
        CALL BACK: lakeside keys!!
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
