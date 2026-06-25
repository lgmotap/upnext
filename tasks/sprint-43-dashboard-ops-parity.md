# Sprint 43 — Dashboard ops parity (CL command-center queues)

> Closes P1 gaps from dashboard vs ConvertLabs audit (Jun 2026).  
> Audit: `canvases/dashboard-vs-convertlabs.canvas.tsx`  
> **Status:** ✅ Complete (Jun 2026).  
> Depends on: sprints 39 (inbox), 06 (payments) stable.

---

## Plan (read before implementing)

### Problem

ConvertLabs dashboard answers **“what needs my attention?”** with four queues. UpNext shows similar numbers but with generic labels, no deep links, weak today-row detail, and no crew events in activity.

### Product decisions (locked)

| CL widget | UpNext KPI | Query definition | Deep link |
|-----------|------------|------------------|-----------|
| Booked Today | **Booked today** | `BookingRequest` where `status = accepted` AND `updatedAt ∈ [todayStart, todayEnd)` | `/app/bookings?status=accepted&range=today` |
| Scheduled Today | **Scheduled today** | Jobs where `scheduledStartAt ∈ today` AND `status ≠ cancelled` | `/app/jobs?date=today` |
| Awaiting Payment | **Awaiting payment** | `PaymentRecord` where `status IN (pending, overdue)` — show **count**; card shows total $ in subtitle optional | `/app/payments?status=pending` |
| Unassigned today | **Needs assignment** | Today’s jobs with `assignments.length === 0` | `/app/jobs?date=today&unassigned=1` |

**Keep unchanged:** Booking requests card with inline `BookingQuickActions` (UpNext wedge).

**Deferred to sprint 44:** time-aware greeting, business name in title, 30-day analytics.

### Implementation order

```
Step 1  Types + repository filters (jobs, payments, bookings list)
Step 2  server/services/dashboard.ts — queue queries + activity merge
Step 3  components/app/ui.tsx — StatCard href + iconWellColor
Step 4  app/app/dashboard/page.tsx — KPIs, header CTA, today rows, activity
Step 5  app/app/jobs/page.tsx + server/repositories/jobs.ts — date/unassigned filters
Step 6  app/app/payments/page.tsx — status filter
Step 7  app/app/bookings/page.tsx — optional range=today on accepted filter (if missing)
Step 8  scripts/smoke-dashboard.ts + package.json script
Step 9  Docs: CHANGELOG, competitor-parity-status
```

---

## Step 1 — Types

### Extend `server/services/dashboard.ts`

```ts
export type DashboardQueueStat = {
  id: "booked_today" | "scheduled_today" | "awaiting_payment" | "unassigned_today";
  label: string;
  value: string;           // count as string for display
  delta?: string;          // e.g. "$1,065 pending" or "2 accepted today"
  href: string;
  icon: "calendar-check" | "calendar-days" | "credit-card" | "user-x"; // map to Lucide
  iconClassName: string;   // e.g. bg-emerald-100 text-emerald-700
};

export type DashboardJobRow = {
  // existing fields +
  addressLine: string | null;
  priceLabel: string;
  frequencyLabel: string | null;
};

export type DashboardData = {
  // replace stats: DashboardStat[] with:
  queueStats: DashboardQueueStat[];
  // ... rest unchanged
};
```

---

## Step 2 — `getDashboardData` queries

### Add to `Promise.all` batch

```ts
// 1. Booked today (accepted today)
prisma.bookingRequest.count({
  where: {
    organizationId,
    status: "accepted",
    updatedAt: { gte: todayStart, lt: todayEnd },
  },
}),

// 2. Scheduled today — reuse todayJobsRaw.length after fetch

// 3. Awaiting payment — reuse paymentAgg (pending + overdue counts)

// 4. Unassigned today
prisma.job.count({
  where: {
    organizationId,
    scheduledStartAt: { gte: todayStart, lt: todayEnd },
    status: { notIn: ["cancelled"] },
    assignments: { none: {} },
  },
}),
```

**Note:** `BookingRequest` has no `acceptedAt`. Using `updatedAt` on accept is correct if `updateBookingRequestStatus` always touches `updatedAt`. Verify in `server/services/bookings.ts`; if accept only sets status without reliable timestamp, add filter `status: accepted` + `job.createdAt` in today bounds as fallback.

### Enrich `todayJobsRaw` include

```ts
include: {
  customer: true,
  service: true,
  customerAddress: true,
  bookingRequest: { select: { frequency: true } },
  jobSeries: { select: { frequency: true } },
  assignments: { include: { membership: { include: { user: true } } }, take: 1 },
},
```

### Map `DashboardJobRow`

```ts
import { formatMoney } from "@/lib/money/format";
import { formatAddressLine } from "@/lib/datetime/calendar";
import { frequencyLabel } from "@/lib/booking/frequency";

addressLine: job.customerAddress
  ? formatAddressLine(job.customerAddress)
  : null,
priceLabel: formatMoney(job.priceCents, job.currency ?? currency),
frequencyLabel: job.jobSeries
  ? frequencyLabel(job.jobSeries.frequency)
  : job.bookingRequest
    ? frequencyLabel(job.bookingRequest.frequency)
    : null,
```

### Activity — crew events from `NotificationLog`

```ts
const crewTemplates: NotificationTemplate[] = [
  "job_on_the_way",
  "job_running_late",
  "job_completed", // optional: only if triggered from crew
];

const crewLogs = await prisma.notificationLog.findMany({
  where: {
    organizationId,
    template: { in: crewTemplates },
    createdAt: { gte: addDays(now, -7) }, // last 7 days cap for perf
  },
  orderBy: { createdAt: "desc" },
  take: 15,
  // include related job/customer if relatedId stores jobId — join in app layer
});
```

For each log, resolve `relatedId` → job → customer name:

```ts
who: "Team", // or assignee first name if resolvable
what: `${templateLabel(log.template)} — ${customerName}`,
at: log.createdAt,
```

**Dedupe:** before merge, skip if same `relatedId` + `template` within 5 minutes of an existing event.

Merge with existing booking/job/payment events → sort by `at` desc → `slice(0, 10)`.

---

## Step 3 — `StatCard` / `QueueStatCard`

### Option A (preferred): extend `StatCard` in `components/app/ui.tsx`

```ts
export function StatCard({
  label, value, delta, trend, icon: Icon,
  href,
  iconClassName = "bg-brand-100 text-brand-700",
  showTrend = true,
}: {
  href?: string;
  iconClassName?: string;
  showTrend?: boolean;
  // ...
}) {
  const inner = (/* existing card body */);
  if (href) {
    return (
      <Link href={href} className="block transition hover:ring-2 hover:ring-brand-200 rounded-2xl">
        {inner}
      </Link>
    );
  }
  return inner;
}
```

For queue KPIs: pass `showTrend={false}` — use `delta` for human subtitle (“3 jobs”, “$420 pending”) not up/down arrows.

### KPI icon mapping (dashboard page)

| id | Lucide | iconClassName |
|----|--------|---------------|
| booked_today | `CalendarCheck` | `bg-emerald-100 text-emerald-700` |
| scheduled_today | `CalendarDays` | `bg-sky-100 text-sky-700` |
| awaiting_payment | `CreditCard` | `bg-amber-100 text-amber-800` |
| unassigned_today | `UserX` | `bg-rose-100 text-rose-700` |

---

## Step 4 — `app/app/dashboard/page.tsx`

### Header CTA

```tsx
<PageHeader
  title={`Good morning, ${data.greetingName}`}  // sprint 44 changes this
  subtitle={`${data.dateLabel} · here's what's happening today.`}
  action={
    <div className="flex flex-wrap gap-2">
      <AppButton href="/app/bookings/new">New booking</AppButton>
      <AppButton href="/app/calendar" variant="outline">View calendar</AppButton>
    </div>
  }
/>
```

### KPI grid

```tsx
{data.queueStats.map((s) => (
  <StatCard key={s.id} {...s} showTrend={false} />
))}
```

### Today’s schedule row layout

```tsx
<Link ... className="flex items-center gap-3 px-5 py-3 ...">
  <Avatar ... />
  <div className="min-w-0 flex-1">
    <p className="truncate text-sm font-semibold">{j.customerName}</p>
    <p className="truncate text-xs text-ink-500">
      {j.serviceName} · {j.startTime}
      {j.addressLine && <> · {j.addressLine}</>}
    </p>
    {j.frequencyLabel && (
      <span className="mt-1 inline-block rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold text-ink-600">
        {j.frequencyLabel}
      </span>
    )}
  </div>
  <span className="hidden text-sm font-semibold text-ink-900 sm:block">{j.priceLabel}</span>
  {/* assignee + StatusBadge */}
</Link>
```

---

## Step 5 — Jobs list filters

### `server/repositories/jobs.ts`

Add options:

```ts
export type ListJobsOptions = {
  status?: JobStatus;
  page?: number;
  pageSize?: number;
  scheduledFrom?: Date;
  scheduledTo?: Date;
  unassignedOnly?: boolean;
};

export function listJobsForOrg(orgId, options?: ListJobsOptions) {
  return prisma.job.findMany({
    where: {
      organizationId: orgId,
      ...(options?.status ? { status: options.status } : {}),
      ...(options?.scheduledFrom && options?.scheduledTo
        ? { scheduledStartAt: { gte: options.scheduledFrom, lt: options.scheduledTo } }
        : {}),
      ...(options?.unassignedOnly ? { assignments: { none: {} } } : {}),
    },
    // ...
  });
}

export function countJobsForOrg(orgId, options?: Omit<ListJobsOptions, "page" | "pageSize">) {
  // mirror where clause
}
```

### `app/app/jobs/page.tsx`

```ts
searchParams: Promise<{ page?: string; date?: string; unassigned?: string }>

const todayYmd = formatYmdInTimezone(new Date(), timeZone);
if (params.date === "today") {
  const { start, end } = getDayBoundsUtc(todayYmd, timeZone);
  listOptions.scheduledFrom = start;
  listOptions.scheduledTo = end;
}
if (params.unassigned === "1") {
  listOptions.unassignedOnly = true;
}
```

**Page subtitle when filtered:** “Showing today's jobs” / “Unassigned today”.

---

## Step 6 — Payments filter

### `app/app/payments/page.tsx`

```ts
searchParams: Promise<{ status?: string }>

const statusFilter = params.status === "pending"
  ? ["pending", "overdue"] as const
  : params.status === "overdue"
    ? ["overdue"] as const
    : null;

const payments = statusFilter
  ? allPayments.filter((p) => statusFilter.includes(p.status))
  : allPayments;
```

Show filter pill in `PageHeader` subtitle when active.

---

## Step 7 — Bookings filter (optional, for Booked today link)

If `/app/bookings` lacks `range=today`, add to sprint 39 filters:

```ts
// status=accepted + createdAt or updatedAt in today
```

Or link Booked today KPI to `/app/bookings?status=accepted` only (simpler — document in sprint if skipped).

---

## Step 8 — Smoke test

### `scripts/smoke-dashboard.ts`

1. Seed org via existing smoke helper pattern (`smoke-test-co` style)
2. Create: 1 accepted booking today, 1 job today unassigned, 1 pending payment
3. Call `getDashboardData(orgId, tz, "USD", "Test")`
4. Assert:
   - `queueStats.find(id=booked_today).value === "1"`
   - `queueStats.find(id=unassigned_today).value === "1"`
   - `queueStats.find(id=awaiting_payment).value` includes count
   - `todayJobs[0].priceLabel` matches `formatMoney`
5. Optional: `fetch` internal routes not needed — service-level assert sufficient

Add to `package.json`: `"smoke:dashboard": "tsx scripts/smoke-dashboard.ts"`

---

## Scope checklist

### KPI queue strip

- [x] Four `DashboardQueueStat` with icons + colors
- [x] Each card links to filtered route
- [x] No misleading trend arrows on queue cards

### List view filters

- [x] `/app/payments?status=pending`
- [x] `/app/jobs?date=today&unassigned=1`

### Header CTA

- [x] Primary: New booking
- [x] Secondary: View calendar (outline)

### Today’s schedule enrichment

- [x] addressLine, priceLabel, frequencyLabel on rows

### Activity feed — crew events

- [x] NotificationLog templates merged + deduped

### Tests & docs

- [x] `smoke:dashboard`
- [x] `CHANGELOG.md` + parity status

## Out of scope

- 30-day sparklines → sprint 44
- Time-aware greeting → sprint 44
- Help center link → backlog P2
- WebSocket “Live” indicator

---

## Acceptance criteria

1. All four KPIs match definitions in Plan table for seeded data.
2. Clicking each KPI lands on a list filtered correctly.
3. Dashboard header creates manual booking in one click.
4. Today row shows address + price for jobs with data.
5. OTW notification appears in activity within last 7 days.
6. `npm run smoke:dashboard` passes in CI/local.

---

## Validation

- [x] `npm run smoke:dashboard`
- [x] `npm run db:validate`
- [x] `npm run typecheck` + `npm run build`
- [x] Manual KPI click-through
