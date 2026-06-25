# Sprint 44 — Dashboard analytics snapshot (post-onboarding)

> Closes P2 perception gaps vs ConvertLabs dashboard analytics layer.  
> Audit: `canvases/dashboard-vs-convertlabs.canvas.tsx`  
> **Status:** ✅ Complete (Jun 2026).  
> Depends on: sprint 37 (`server/services/reporting.ts`), sprint 43 (queue KPIs).

---

## Plan (read before implementing)

### Problem

After Getting Started completes, the dashboard feels thin vs ConvertLabs’ 30-day booking summary and revenue chart. Analytics exist on `/app/reports` but are not teased on home.

### Product decisions (locked)

| CL widget | UpNext widget | Data source |
|-----------|---------------|-------------|
| Bookings created 30d + $ | Card: count + sum of `BookingRequest` created in range | `createdAt` in last 30d; $ = sum of linked job `priceCents` or quote on accept |
| Bookings scheduled 30d + $ | Card: jobs with `scheduledStartAt` in range (non-cancelled) | sum `priceCents` |
| Gross revenue 90d chart | **30-day** paid revenue mini bar chart | `PaymentRecord.paidAt` daily buckets |
| MRR / retention / growth % | **Not built** | — |
| Getting Started slot | `BusinessSnapshot` when `gettingStarted.percent >= 100` | replaces checklist only |

### Implementation order

```
Step 1  lib/datetime/greeting.ts
Step 2  lib/reporting/period-stats.ts (shared aggregates)
Step 3  Refactor server/services/reporting.ts to use shared helpers
Step 4  Extend server/services/dashboard.ts — snapshot + greeting fields
Step 5  components/app/BusinessSnapshot.tsx (new)
Step 6  app/app/dashboard/page.tsx — greeting, conditional snapshot, analytics row
Step 7  Extend scripts/smoke-dashboard.ts
Step 8  Docs + CHANGELOG
```

---

## Step 1 — `lib/datetime/greeting.ts`

```ts
export type GreetingPeriod = "morning" | "afternoon" | "evening";

export function getGreetingPeriod(now: Date, timeZone: string): GreetingPeriod {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hour12: false }).format(now),
  );
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function formatGreetingTitle(
  period: GreetingPeriod,
  displayName: string,
): string {
  const word = period === "morning" ? "morning" : period === "afternoon" ? "afternoon" : "evening";
  return `Good ${word}, ${displayName}`;
}

export function formatGreetingSubtitle(
  userFirstName: string,
  dateLabel: string,
): string {
  return `Hi ${userFirstName} · ${dateLabel}`;
}
```

**Display name resolution** (in dashboard page or service):

```ts
businessProfile.displayName ?? organization.name ?? "your business"
```

---

## Step 2 — `lib/reporting/period-stats.ts` (new)

Pure date-range helpers used by **reports** and **dashboard**.

```ts
export type PeriodBounds = { start: Date; end: Date; fromYmd: string; toYmd: string };

export function last30DayBounds(timeZone: string, now = new Date()): PeriodBounds {
  const toYmd = formatYmdInTimezone(now, timeZone);
  const fromYmd = addDaysYmd(toYmd, -29); // inclusive 30 days
  return {
    fromYmd,
    toYmd,
    start: localDateTimeToUtc(fromYmd, "00:00", timeZone),
    end: localDateTimeToUtc(addDaysYmd(toYmd, 1), "00:00", timeZone),
  };
}

export type ThirtyDaySnapshot = {
  fromYmd: string;
  toYmd: string;
  bookingsCreatedCount: number;
  bookingsCreatedValueCents: number;
  jobsScheduledCount: number;
  jobsScheduledValueCents: number;
  revenueCollectedCents: number;
  revenueDailyCents: number[]; // length 30, aligned to fromYmd..toYmd
  revenueDailyBars: number[];  // 0-100 normalized for UI
};
```

### `getThirtyDaySnapshot(organizationId, timeZone): Promise<ThirtyDaySnapshot>`

**Queries (single `Promise.all`):**

```ts
// Bookings created in range
prisma.bookingRequest.findMany({
  where: { organizationId, createdAt: { gte: start, lt: end } },
  include: { job: { select: { priceCents: true } } },
}),

// Jobs scheduled in range (not cancelled)
prisma.job.findMany({
  where: {
    organizationId,
    scheduledStartAt: { gte: start, lt: end },
    status: { notIn: ["cancelled"] },
  },
  select: { priceCents: true, scheduledStartAt: true },
}),

// Paid payments in range
prisma.paymentRecord.findMany({
  where: {
    organizationId,
    status: "paid",
    paidAt: { gte: start, lt: end, not: null },
  },
  select: { amountCents: true, paidAt: true },
}),
```

**Aggregations:**

- `bookingsCreatedCount` = bookings.length
- `bookingsCreatedValueCents` = sum of `job?.priceCents ?? 0` for accepted bookings with jobs, else 0 for pending
- `jobsScheduledCount` = jobs.length
- `jobsScheduledValueCents` = sum `priceCents`
- `revenueCollectedCents` = sum paid amounts
- `revenueDailyCents` — bucket `paidAt` by YMD in org TZ for each of 30 days
- `revenueDailyBars` — normalize to max daily cents (min bar height 4% like dashboard week chart)

**Export from** `server/services/reporting.ts`:

```ts
export { getThirtyDaySnapshot, last30DayBounds } from "@/lib/reporting/period-stats";
```

Refactor `getReportingRangeStats` to call shared `sumPaidInRange` / counts if duplicated.

---

## Step 3 — Extend `DashboardData`

```ts
export type DashboardData = {
  greetingTitle: string;      // "Good evening, Fresh Home Cleaning"
  greetingSubtitle: string;   // "Hi Luis · Thursday, June 25"
  showBusinessSnapshot: boolean; // gettingStarted.percent >= 100
  snapshot: ThirtyDaySnapshot | null; // null when showBusinessSnapshot false
  queueStats: DashboardQueueStat[];   // from sprint 43
  // ... todayJobs, pendingBookings, activity, week revenue row (keep or demote)
};
```

**`getDashboardData` signature change:**

Add params:

```ts
displayName: string;
gettingStartedPercent: number;
```

Or fetch getting-started inside service — prefer **page passes percent** to avoid double query.

---

## Step 4 — `components/app/BusinessSnapshot.tsx` (new)

**Props**

```ts
{
  bookingUrl: string;
  snapshot: ThirtyDaySnapshot;
  currency: string;
  reportsHref: string; // `/app/reports?from=${from}&to=${to}`
}
```

**Layout** — replaces `GettingStartedChecklist` when `showBusinessSnapshot`:

```tsx
<Card className="mb-6">
  <CardHeader
    title="Business snapshot"
    action={<Link href={reportsHref}>View reports</Link>}
  />
  <CardBody>
    <p className="text-sm text-ink-500 mb-4">Last 30 days at a glance</p>
    <div className="grid gap-4 sm:grid-cols-3">
      <SnapshotMetricCard label="Bookings created" count={...} value={formatMoney(...)} />
      <SnapshotMetricCard label="Jobs scheduled" ... />
      <SnapshotRevenueCard bars={snapshot.revenueDailyBars} total={...} />
    </div>
  </CardBody>
</Card>
```

**Empty state** (all zeros):

```tsx
<p>No bookings in the last 30 days.</p>
<CopyBookingLink url={bookingUrl} /> // reuse component
```

---

## Step 5 — `app/app/dashboard/page.tsx` layout

```tsx
const displayName = org.businessProfile?.displayName ?? session.orgName ?? "there";

// fetch gettingStarted first or parallel
const greetingPeriod = getGreetingPeriod(new Date(), timeZone);

<PageHeader
  title={formatGreetingTitle(greetingPeriod, displayName)}
  subtitle={formatGreetingSubtitle(data.greetingName, data.dateLabel)}
  action={/* sprint 43 CTAs */}
/>

{gettingStarted.percent < 100 && bookingUrl ? (
  <GettingStartedChecklist ... />
) : data.snapshot ? (
  <BusinessSnapshot
    bookingUrl={bookingUrl}
    snapshot={data.snapshot}
    currency={currency}
    reportsHref={`/app/reports?from=${data.snapshot.fromYmd}&to=${data.snapshot.toYmd}`}
  />
) : null}

{/* queueStats row — sprint 43 */}
{/* today schedule + booking requests — unchanged */}
{/* Optional: keep week revenue card OR remove if redundant with snapshot — keep for now */}
```

**Org query extension:**

```ts
businessProfile: { select: { publicSlug: true, displayName: true } },
```

---

## Step 6 — Reports page link compatibility

Verify `app/app/reports/page.tsx` reads `from` / `to` query params (sprint 37). Snapshot links must use same `YYYY-MM-DD` format.

---

## Step 7 — Performance note

`getThirtyDaySnapshot` adds ~3 queries on dashboard load. Acceptable for MVP.

**Future (not this sprint):** React `cache()` wrapper or 60s TTL — do not implement unless profiling shows issue.

---

## Step 8 — Smoke extensions

Extend `scripts/smoke-dashboard.ts`:

1. Org with `onboardingCompletedAt` set + gettingStarted percent 100
2. Seed booking + job + payment in last 30 days
3. Assert `snapshot.bookingsCreatedCount >= 1`
4. Assert `snapshot.revenueCollectedCents > 0`
5. Assert `greetingTitle` contains displayName
6. Assert `showBusinessSnapshot === true`

Run: `npm run smoke:dashboard` + `npm run smoke:reports`

---

## Scope checklist

### Time-aware greeting

- [x] `lib/datetime/greeting.ts`
- [x] Title = business display name
- [x] Subtitle = user first name + date

### Business snapshot row

- [x] `BusinessSnapshot` component
- [x] Shown only when Getting Started 100%
- [x] Three metrics + revenue bars
- [x] Links to reports with range

### Reporting helper extraction

- [x] `lib/reporting/period-stats.ts`
- [x] `reporting.ts` re-exports / reuses helpers

### Tests & docs

- [x] Extended `smoke:dashboard`
- [x] `docs/audits/product-gaps-roadmap.md` § Dashboard
- [x] `CHANGELOG.md`

## Out of scope

- MRR, retention rate, booking growth %
- 90-day line chart / chart library
- Period-over-period % badges
- Email scheduled reports

---

## UI spec (analytics row — optional second row)

If keeping **both** BusinessSnapshot (top) and a compact analytics strip below KPIs is too heavy, **only use BusinessSnapshot** in checklist slot — do not duplicate 30d cards twice.

Recommended: **single BusinessSnapshot card** at top when onboarding complete; remove duplicate week revenue card in same sprint only if snapshot revenue chart makes it redundant (product call: keep week chart for “this week” vs 30d).

---

## Acceptance criteria

1. Greeting changes by time of day in org timezone.
2. Business name appears in dashboard title.
3. At 100% getting started, snapshot row visible with real 30d data.
4. Snapshot “View reports” opens reports with correct `from`/`to`.
5. Empty 30d state prompts sharing booking link.
6. No duplicate Prisma logic between dashboard and reports exports.
7. `smoke:dashboard` + `smoke:reports` green.

---

## Validation

- [x] `npm run smoke:dashboard`
- [x] `npm run smoke:reports`
- [x] `npm run typecheck` + `npm run build`
