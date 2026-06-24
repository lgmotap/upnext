# Sprint 14 — Recurring jobs engine

> CL: Service Studio Frequencies + recurring bookings. Frequency is stored (sprint 11) but jobs are not auto-generated.

## Schema

- [x] `JobSeries` — org, customer, service, address, frequency, price, duration, `preferredTimeHm`, `nextOccurrenceAt`, `status` (active/paused/cancelled)
- [x] `Job.jobSeriesId` optional link
- [x] Migration `sprint_14_job_series`

## Business logic

- [x] On accept booking (or manual accept) when `frequency != one_time` → create `JobSeries` from first job
- [x] `calculateNextOccurrence(from, frequency, timezone)` — weekly / biweekly / monthly
- [x] Cron `POST /api/cron/recurring-jobs` — generate scheduled job + payment row for due series
- [x] Copy assignment from series if set
- [x] Notify customer + owner on auto-generated job (email)
- [x] Pause / resume / cancel series (owner actions)

## UI

- [x] Booking detail — recurring badge + next date + link to series
- [x] Job detail — series info + pause/cancel series
- [x] `/app/series` or section on jobs list (optional minimal: job detail only for MVP)

## Smokes & cron

- [x] `npm run smoke:recurring`
- [x] `vercel.json` cron entry for recurring-jobs (daily)

## Docs

- [x] `docs/16-recurring-jobs.md` — behavior + cron setup
