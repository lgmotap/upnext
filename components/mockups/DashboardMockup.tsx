import {
  LayoutDashboard,
  CalendarDays,
  Users,
  CreditCard,
  Inbox,
  Search,
  Bell,
  TrendingUp,
  Sparkles,
} from "lucide-react";

const jobs = [
  { time: "8:30", client: "Harper Residence", service: "Deep clean", who: "Maya R.", color: "bg-brand-500", status: "In progress", statusCls: "bg-amber-50 text-amber-700" },
  { time: "10:00", client: "Lakeside Offices", service: "Commercial", who: "Team A", color: "bg-sky-500", status: "Scheduled", statusCls: "bg-ink-100 t ext-ink-600" },
  { time: "1:30", client: "Nguyen Family", service: "Recurring", who: "Jordan P.", color: "bg-violet-500", status: "Confirmed", statusCls: "bg-brand-100 text-brand-800" },
  { time: "3:00", client: "Oak St. Rental", service: "Move-out", who: "Maya R.", color: "bg-rose-400", status: "Paid", statusCls: "bg-emerald-50 text-emerald-700" },
];

const bars = [38, 52, 44, 66, 58, 78, 90];

export function DashboardMockup({ className = "" }: { className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl bg-white ring-1 ring-ink-200/70 shadow-float ${className}`}
      role="img"
      aria-label="UpNext dashboard preview showing today's jobs, revenue, bookings, and team assignments"
    >
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-ink-100 bg-ink-50/60 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-rose-300" />
        <span className="size-2.5 rounded-full bg-amber-300" />
        <span className="size-2.5 rounded-full bg-emerald-300" />
        <div className="mx-auto flex h-5 w-44 items-center justify-center rounded-md bg-white text-[9px] text-ink-400 ring-1 ring-ink-100">
          app.upnext.com/dashboard
        </div>
      </div>

      <div className="flex text-left">
        {/* sidebar */}
        <div className="hidden w-36 shrink-0 flex-col gap-1 border-r border-ink-100 bg-ink-50/40 p-3 sm:flex">
          <div className="mb-2 flex items-center gap-1.5 px-1.5">
            <span className="flex size-5 items-center justify-center rounded-md bg-brand-600">
              <Sparkles className="size-3 text-white" />
            </span>
            <span className="text-[11px] font-bold text-ink-900">UpNext</span>
          </div>
          {[
            { icon: LayoutDashboard, label: "Dashboard", active: true },
            { icon: CalendarDays, label: "Schedule" },
            { icon: Inbox, label: "Bookings", badge: "3" },
            { icon: Users, label: "Team" },
            { icon: CreditCard, label: "Payments" },
          ].map(({ icon: Icon, label, active, badge }) => (
            <div
              key={label}
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] font-medium ${
                active ? "bg-brand-600 text-white shadow-sm" : "text-ink-600"
              }`}
            >
              <Icon className="size-3" />
              {label}
              {badge && (
                <span className="ml-auto rounded-full bg-brand-100 px-1.5 text-[8px] font-bold text-brand-800">
                  {badge}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* main */}
        <div className="min-w-0 flex-1 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[12px] font-bold text-ink-950">Good morning, Alex</p>
              <p className="text-[9px] text-ink-500">Tuesday · 6 jobs today</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-24 items-center gap-1.5 rounded-full bg-ink-50 px-2 text-[8px] text-ink-400 ring-1 ring-ink-100">
                <Search className="size-2.5" /> Search…
              </span>
              <Bell className="size-3.5 text-ink-400" />
              <span className="flex size-6 items-center justify-center rounded-full bg-brand-200 text-[8px] font-bold text-brand-900">
                AB
              </span>
            </div>
          </div>

          {/* stat cards */}
          <div className="mb-3 grid grid-cols-3 gap-2">
            {[
              { label: "Revenue this week", value: "$4,860", delta: "+18%" },
              { label: "Jobs today", value: "6", delta: "2 done" },
              { label: "New bookings", value: "9", delta: "+3 today" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-ink-50/60 p-2.5 ring-1 ring-ink-100">
                <p className="text-[8px] font-medium text-ink-500">{s.label}</p>
                <p className="text-[15px] font-bold text-ink-950">{s.value}</p>
                <p className="flex items-center gap-0.5 text-[8px] font-semibold text-emerald-600">
                  <TrendingUp className="size-2" /> {s.delta}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-5 gap-2">
            {/* job list */}
            <div className="col-span-3 rounded-xl ring-1 ring-ink-100 p-2.5">
              <p className="mb-2 text-[9px] font-bold text-ink-900">Today&apos;s jobs</p>
              <div className="space-y-1.5">
                {jobs.map((j) => (
                  <div key={j.client} className="flex items-center gap-2 rounded-lg bg-ink-50/50 px-2 py-1.5">
                    <span className={`h-6 w-1 rounded-full ${j.color}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[9px] font-semibold text-ink-900">{j.client}</p>
                      <p className="text-[8px] text-ink-500">
                        {j.time} · {j.service} · {j.who}
                      </p>
                    </div>
                    <span className={`rounded-full px-1.5 py-0.5 text-[7px] font-bold ${j.statusCls}`}>
                      {j.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* revenue chart */}
            <div className="col-span-2 flex flex-col rounded-xl ring-1 ring-ink-100 p-2.5">
              <p className="text-[9px] font-bold text-ink-900">Revenue</p>
              <p className="mb-2 text-[8px] text-ink-500">Last 7 days</p>
              <div className="flex flex-1 items-end gap-1.5">
                {bars.map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className={`flex-1 rounded-t-md ${i === bars.length - 1 ? "bg-brand-500" : "bg-brand-200"}`}
                  />
                ))}
              </div>
              <div className="mt-2 rounded-lg bg-brand-50 px-2 py-1.5 text-[8px] font-semibold text-brand-800">
                2 payments pending follow-up
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
