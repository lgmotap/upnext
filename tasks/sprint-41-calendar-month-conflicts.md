# Sprint 41 — Calendar month view + conflict hints

> Owner calendar ops polish vs CL week + scheduler.  
> Audit: `docs/audits/product-gaps-roadmap.md` § Calendar  
> **Status:** ✅ Shipped — use this doc as as-built spec + regression checklist.

---

## Plan (read before implementing or verifying)

### Problem

Owner calendar was week-only. Dispatchers using ConvertLabs switch between week and month for capacity planning. Conflict detection existed in `lib/scheduling/conflicts.ts` but was invisible on the calendar.

### Product decisions (locked)

| Decision | Choice |
|----------|--------|
| Default view | **Week** — month is opt-in via `?view=month` |
| Month cell content | Job **count** + pending count + conflict icon — not full titles |
| Day click | Navigate to `?view=week&week={weekStartYmd}` centered on that day |
| Conflicts | Read-only warning on chips — resolve in scheduler / job detail |
| Pending bookings | Amber `Np` badge on month; dashed chip on week |
| Drag on week | **No** — scheduler board (sprint 31) handles dispatch |

### Implementation order (as built)

1. `lib/datetime/calendar.ts` — `getMonthRange`, `getWeekStartYmd` (if not present)
2. `lib/scheduling/conflicts.ts` — `buildJobConflictMap` wrapper for calendar rows
3. `server/repositories/bookings.ts` — `listPendingBookingsInRange`
4. `server/repositories/jobs.ts` — `listJobsInRange` with assignments
5. UI primitives: `CalendarViewToggle`, `CalendarMonthNav`, `OwnerCalendarMonthGrid`, `CalendarJobChip`, `CalendarPendingChip`
6. `app/app/calendar/page.tsx` — branch on `searchParams.view`
7. Validation smokes + manual browser

---

## Detailed file map (as built)

### `app/app/calendar/page.tsx`

**Query params**

| Param | Values | Behavior |
|-------|--------|----------|
| `view` | `week` (default) \| `month` | Switches layout |
| `week` | `YYYY-MM-DD` | Week anchor (Monday-start via `getWeekRange`) |
| `month` | `YYYY-MM` | Month key for month view |

**Data loading (month branch)**

```ts
const monthRange = getMonthRange(timeZone, monthKey);
const [jobs, pending] = await Promise.all([
  listJobsInRange(orgId, monthRange.rangeStart, monthRange.rangeEnd),
  listPendingBookingsInRange(orgId, monthRange.rangeStart, monthRange.rangeEnd),
]);
const conflictMap = buildJobConflictMap(jobs, policy);
```

**Aggregations per day**

- `jobsByDate[ymd]` — count of jobs
- `pendingByDate[ymd]` — count of pending booking requests
- `conflictJobIdsByDate[ymd]` — count of jobs with `conflictMap.has(job.id)`

**Data loading (week branch)**

- Same `listJobsInRange` + `listPendingBookingsInRange` for week bounds
- `jobsByDate` / `pendingByDate` as arrays per day column
- Pass `conflictMap.get(j.id)` into `CalendarJobChip`

**Policy source**

```ts
bufferMinutesBetweenJobs + providerCarryOverMinutes from BusinessProfile
// fallback DEFAULT_SCHEDULING_POLICY
```

### `components/app/CalendarViewToggle.tsx`

- Links: Week → `/app/calendar?view=week&week={weekStartYmd}`
- Month → `/app/calendar?view=month&month={monthKey}`
- Active state from `view` prop

### `components/app/OwnerCalendarMonthGrid.tsx`

- Uses `buildMonthGrid(monthKey)` from `lib/availability/calendar-ui`
- Each in-month cell is `<Link href={/app/calendar?view=week&week={weekStart}}>`
- Badges: job count (brand), pending `Np` (amber), `AlertTriangle` if conflicts
- `aria-label` includes counts for a11y

### `components/app/CalendarJobChip.tsx`

**Props**

```ts
{
  jobId: string;
  timeLabel: string;
  customerName: string;
  serviceName: string;
  status: string;
  conflicts?: ScheduleConflictOverlap[]; // from conflict map
}
```

**UI**

- Link to `/app/jobs/{jobId}`
- If `conflicts?.length`: `AlertTriangle` + `title="Overlaps with {names}"`
- Status-based chip colors (existing pattern)

### `components/app/CalendarPendingChip.tsx`

- Link to `/app/bookings/{bookingRequestId}`
- Dashed border / amber styling to distinguish from confirmed jobs

### `lib/scheduling/conflicts.ts`

**`buildJobConflictMap(jobs, policy)`**

- Maps calendar job rows → `detectScheduleConflicts`
- Only flags overlap when **same `membershipId`** on both jobs
- Excludes `cancelled` / `completed` from conflict pairing

---

## Scope checklist

### Month view

- [x] Toggle: Week \| Month on `/app/calendar` (`CalendarViewToggle`)
- [x] Month grid with job density counts (`OwnerCalendarMonthGrid`)
- [x] Click day → week view centered on that day

### Conflict hints

- [x] Warning icon on week job chips when worker overlap (`CalendarJobChip`)
- [x] Tooltip via `title` / `aria-label`: “Overlaps with …”
- [x] Month cells show conflict count icon when any job that day conflicts
- [x] Read-only — no drag on week view

### Optional

- [x] Pending booking requests on calendar (month `Np` + week `CalendarPendingChip`)

## Out of scope

- Drag-drop on week view (scheduler board covers dispatch)
- Route optimization / drive time

---

## Test plan

### Automated

```bash
npm run smoke:scheduler   # conflict helper regression
npm run typecheck
npm run build
```

### Manual browser (`smoke-test-co` or dev org)

| # | Step | Expected |
|---|------|----------|
| 1 | Open `/app/calendar` | Week view, 7 columns, today highlighted |
| 2 | Click **Month** toggle | Grid of days with counts |
| 3 | Click a day with jobs | Week view opens; that day in range |
| 4 | Assign same worker to overlapping jobs | Warning icon on both chips |
| 5 | Create pending booking for tomorrow | Amber pending chip on week; `1p` on month |
| 6 | `/app/calendar/scheduler` still works | No regression |

### Edge cases

- Empty month — grid renders, no badges
- Month boundary (`month=2026-01` vs week crossing months) — `week` param uses `getWeekStartYmd`
- Job without assignee — never flagged as worker conflict (by design)
- Cancelled jobs — excluded from `listJobsInRange`

---

## Acceptance criteria

1. Owner can switch week/month without losing org timezone context.
2. Month view communicates load at a glance (counts, not clutter).
3. Worker double-bookings are visible before opening job detail.
4. Pending requests visible separately from confirmed jobs.
5. No new Prisma migrations required.

---

## Validation (record when re-verifying)

- [x] `npm run smoke:scheduler` (no regression)
- [x] Manual browser check month toggle
- [x] `npm run typecheck` + `npm run build`
