import {
  LayoutDashboard,
  CalendarDays,
  Users,
  CreditCard,
  Inbox,
  Search,
  Bell,
  Plus,
  Settings,
  TrendingUp,
  Check,
  X,
  ChevronRight,
} from "lucide-react";

/** Tiny inline sparkline. Color comes from the wrapping text color. */
function Spark({ points }: { points: string }) {
  return (
    <svg viewBox="0 0 80 24" preserveAspectRatio="none" className="h-5 w-full" aria-hidden>
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Avatar({ initials, cls }: { initials: string; cls: string }) {
  return (
    <span className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[7px] font-bold ${cls}`}>
      {initials}
    </span>
  );
}

const stats = [
  { label: "Revenue · this week", value: "$4,860", delta: "+18%", color: "text-brand-500", spark: "0,20 12,15 24,17 36,9 48,12 60,5 72,4 80,2" },
  { label: "Jobs today", value: "6", delta: "2 done", color: "text-ink-400", spark: "0,14 12,12 24,16 36,10 48,14 60,8 72,11 80,7" },
  { label: "New bookings", value: "9", delta: "+3 today", color: "text-brand-500", spark: "0,18 12,14 24,15 36,12 48,8 60,9 72,4 80,3" },
  { label: "Outstanding", value: "$1,240", delta: "2 to chase", color: "text-amber-500", spark: "0,8 12,10 24,7 36,12 48,9 60,13 72,11 80,14" },
];

const rows = [
  { client: "Harper Residence", initials: "HR", avatar: "bg-brand-100 text-brand-700", service: "Deep clean", team: "MR", teamCls: "bg-accent-100 text-accent-700", time: "8:30 AM", status: "In progress", dot: "bg-amber-500", pill: "bg-amber-50 text-amber-700" },
  { client: "Lakeside Offices", initials: "LO", avatar: "bg-violet-100 text-violet-700", service: "Commercial", team: "TA", teamCls: "bg-brand-100 text-brand-700", time: "10:00 AM", status: "Scheduled", dot: "bg-ink-300", pill: "bg-ink-100 text-ink-600" },
  { client: "Nguyen Family", initials: "NF", avatar: "bg-emerald-100 text-emerald-700", service: "Recurring", team: "JP", teamCls: "bg-amber-100 text-amber-700", time: "1:30 PM", status: "Confirmed", dot: "bg-brand-500", pill: "bg-brand-50 text-brand-700" },
  { client: "Oak St. Rental", initials: "OR", avatar: "bg-rose-100 text-rose-700", service: "Move-out", team: "MR", teamCls: "bg-accent-100 text-accent-700", time: "3:00 PM", status: "Paid", dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700" },
  { client: "Greenway LLC", initials: "GL", avatar: "bg-sky-100 text-sky-700", service: "Office", team: "TA", teamCls: "bg-brand-100 text-brand-700", time: "6:00 PM", status: "Scheduled", dot: "bg-ink-300", pill: "bg-ink-100 text-ink-600" },
];

const requests = [
  { client: "Sara B.", initials: "SB", avatar: "bg-brand-100 text-brand-700", service: "Window clean · Fri 2:00 PM" },
  { client: "Mr. Davis", initials: "MD", avatar: "bg-accent-100 text-accent-700", service: "Carpet · Sat 10:00 AM" },
];

const weekBars = [42, 58, 50, 70, 62, 84, 95];

export function DashboardMockup({ className = "" }: { className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl bg-white ring-1 ring-ink-200/70 shadow-float ${className}`}
      role="img"
      aria-label="BookedFox dashboard showing KPI cards, today's schedule with assigned team members and payment status, and incoming booking requests"
    >
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-ink-100 bg-ink-50/70 px-3 py-2">
        <span className="size-2.5 rounded-full bg-rose-300" />
        <span className="size-2.5 rounded-full bg-amber-300" />
        <span className="size-2.5 rounded-full bg-emerald-300" />
        <div className="mx-auto flex h-5 w-48 items-center justify-center gap-1 rounded-md bg-white text-[9px] text-ink-400 ring-1 ring-ink-100">
          <span className="size-1.5 rounded-full bg-emerald-400" /> app.bookedfox.com/dashboard
        </div>
      </div>

      <div className="flex text-left">
        {/* sidebar */}
        <div className="hidden w-32 shrink-0 flex-col border-r border-ink-100 bg-ink-50/40 p-2.5 sm:flex">
          <div className="mb-3 px-1 text-[12px] font-bold tracking-tight text-ink-950">
            Booked<span className="text-brand-600">Fox</span>
            <span className="ml-0.5 inline-block size-1 rounded-full bg-brand-400 align-middle" />
          </div>
          {[
            { icon: LayoutDashboard, label: "Dashboard", active: true },
            { icon: CalendarDays, label: "Schedule" },
            { icon: Inbox, label: "Bookings", badge: "3" },
            { icon: Users, label: "Customers" },
            { icon: Users, label: "Team" },
            { icon: CreditCard, label: "Payments" },
          ].map(({ icon: Icon, label, active, badge }) => (
            <div
              key={label}
              className={`mb-0.5 flex items-center gap-2 rounded-lg px-2 py-1.5 text-[9.5px] font-medium ${
                active ? "bg-brand-600 text-white shadow-sm" : "text-ink-600"
              }`}
            >
              <Icon className="size-3" />
              {label}
              {badge && (
                <span className="ml-auto rounded-full bg-brand-500 px-1.5 text-[7px] font-bold text-white">
                  {badge}
                </span>
              )}
            </div>
          ))}
          <div className="mt-auto flex items-center gap-2 rounded-lg px-2 py-1.5 text-[9.5px] font-medium text-ink-500">
            <Settings className="size-3" /> Settings
          </div>
        </div>

        {/* main */}
        <div className="min-w-0 flex-1">
          {/* topbar */}
          <div className="flex items-center gap-2 border-b border-ink-100 px-3.5 py-2.5">
            <div>
              <p className="text-[12px] font-bold text-ink-950">Good morning, Alex</p>
              <p className="text-[8px] text-ink-400">Tuesday, June 16 · 6 jobs today</p>
            </div>
            <span className="ml-auto flex h-6 w-28 items-center gap-1.5 rounded-full bg-ink-50 px-2 text-[8px] text-ink-400 ring-1 ring-ink-100">
              <Search className="size-2.5" /> Search…
            </span>
            <span className="relative">
              <Bell className="size-3.5 text-ink-400" />
              <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-brand-400 ring-1 ring-white" />
            </span>
            <span className="flex items-center gap-1 rounded-full bg-brand-400 px-2 py-1 text-[8px] font-bold text-brand-950 shadow-sm">
              <Plus className="size-2.5" /> New
            </span>
            <Avatar initials="AB" cls="bg-brand-200 text-brand-900 !size-6 !text-[8px]" />
          </div>

          <div className="p-3">
            {/* KPI cards */}
            <div className="mb-2.5 grid grid-cols-4 gap-2">
              {stats.map((s) => (
                <div key={s.label} className="rounded-xl bg-white p-2 ring-1 ring-ink-100">
                  <p className="truncate text-[7px] font-medium text-ink-400">{s.label}</p>
                  <p className="text-[13px] font-bold leading-tight text-ink-950">{s.value}</p>
                  <div className={`mt-1 ${s.color}`}>
                    <Spark points={s.spark} />
                  </div>
                  <p className="mt-0.5 flex items-center gap-0.5 text-[7px] font-semibold text-ink-500">
                    <TrendingUp className="size-2 text-emerald-500" /> {s.delta}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-5 gap-2">
              {/* schedule table */}
              <div className="col-span-3 rounded-xl ring-1 ring-ink-100">
                <div className="flex items-center justify-between border-b border-ink-100 px-2.5 py-2">
                  <p className="text-[9px] font-bold text-ink-900">Today&apos;s schedule</p>
                  <span className="flex items-center gap-0.5 text-[7.5px] font-semibold text-brand-600">
                    View all <ChevronRight className="size-2.5" />
                  </span>
                </div>
                {/* column header */}
                <div className="grid grid-cols-[1.6fr_1fr_0.7fr_0.9fr] gap-1 border-b border-ink-100 px-2.5 py-1 text-[7px] font-bold uppercase tracking-wide text-ink-400">
                  <span>Customer</span>
                  <span>Service</span>
                  <span>Team</span>
                  <span className="text-right">Status</span>
                </div>
                {rows.map((r) => (
                  <div
                    key={r.client}
                    className="grid grid-cols-[1.6fr_1fr_0.7fr_0.9fr] items-center gap-1 border-b border-ink-50 px-2.5 py-1.5 last:border-0"
                  >
                    <div className="flex min-w-0 items-center gap-1.5">
                      <Avatar initials={r.initials} cls={r.avatar} />
                      <div className="min-w-0">
                        <p className="truncate text-[8.5px] font-semibold text-ink-900">{r.client}</p>
                        <p className="text-[7px] text-ink-400">{r.time}</p>
                      </div>
                    </div>
                    <span className="truncate text-[8px] text-ink-600">{r.service}</span>
                    <Avatar initials={r.team} cls={r.teamCls} />
                    <span className={`ml-auto inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[7px] font-bold ${r.pill}`}>
                      <span className={`size-1 rounded-full ${r.dot}`} /> {r.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* right column */}
              <div className="col-span-2 space-y-2">
                {/* booking requests */}
                <div className="rounded-xl ring-1 ring-ink-100">
                  <div className="flex items-center justify-between border-b border-ink-100 px-2.5 py-2">
                    <p className="text-[9px] font-bold text-ink-900">Booking requests</p>
                    <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[7px] font-bold text-brand-700">
                      3 new
                    </span>
                  </div>
                  {requests.map((q) => (
                    <div key={q.client} className="flex items-center gap-1.5 border-b border-ink-50 px-2.5 py-1.5 last:border-0">
                      <Avatar initials={q.initials} cls={q.avatar} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[8.5px] font-semibold text-ink-900">{q.client}</p>
                        <p className="truncate text-[7px] text-ink-400">{q.service}</p>
                      </div>
                      <span className="flex size-4 items-center justify-center rounded-md bg-brand-600 text-white">
                        <Check className="size-2.5" />
                      </span>
                      <span className="flex size-4 items-center justify-center rounded-md bg-ink-100 text-ink-500">
                        <X className="size-2.5" />
                      </span>
                    </div>
                  ))}
                </div>

                {/* revenue chart */}
                <div className="rounded-xl ring-1 ring-ink-100 p-2.5">
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <p className="text-[9px] font-bold text-ink-900">Revenue</p>
                    <p className="text-[7px] text-ink-400">Mon–Sun</p>
                  </div>
                  <div className="flex h-12 items-end gap-1">
                    {weekBars.map((h, i) => (
                      <div
                        key={i}
                        style={{ height: `${h}%` }}
                        className={`flex-1 rounded-t ${i === weekBars.length - 1 ? "bg-brand-400" : "bg-brand-500/70"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
