# Recurring jobs

UpNext stores **frequency** on each `BookingRequest` (one-time, weekly, bi-weekly, monthly). When a recurring booking is **accepted**, a `JobSeries` row tracks the schedule.

## Behavior

1. Owner accepts a booking with `frequency != one_time` → `JobSeries` created from the first job.
2. Daily cron `POST /api/cron/recurring-jobs` (Bearer `CRON_SECRET`) generates the next **scheduled job** + payment row when `nextOccurrenceAt` is due.
3. Owner can **pause**, **resume**, or **cancel** the series from the job detail page.

## Cron

Configured in `vercel.json` (13:00 UTC daily). Local test:

```bash
curl -X POST http://localhost:3000/api/cron/recurring-jobs \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Smoke

```bash
npm run smoke:recurring
```

## Notifications

Auto-generated visits send `recurring_job_scheduled` email to the customer.
