# Sprint 37 — Reports v2 (date range + export)

> Closes deferred items from sprint 13 vs CL `/booking/reports`.  
> Audit: `docs/audits/product-gaps-roadmap.md` § Reports

## Current state

- `/app/reports` — stat cards, this week/month breakdown, 4-week revenue bars
- `server/services/reporting.ts` — fixed periods only
- `npm run smoke:reports` exists

## Scope

### Date range

- [x] Query params or form: `from` / `to` (default: this month)
- [x] Extend `server/services/reporting.ts` to filter `PaymentRecord`, `Job`, `BookingRequest` by range
- [x] Update page UI — range picker (native date inputs or lightweight picker; no new chart lib required for MVP)

### CSV export

- [x] `GET` or server action: export jobs + payments summary for selected range
- [x] Download button on reports page (owner/admin only)
- [x] Columns: date, customer, service, job status, amount, payment status

### Polish

- [x] Empty state when range has no data
- [x] Preserve existing stat cards for “all time” or move under tabs (Overview | Export)

**Follow-up:** Sprint 44 reuses reporting aggregates for dashboard 30-day snapshot widgets.

## Out of scope

- Full CL analytics module (quotes, AR aging)
- Third-party chart library unless needed for one additional trend view
- Scheduled email reports

## Validation

- [x] Extend `scripts/smoke-reports.ts` — range query + export response
- [x] `npm run smoke:reports`
- [x] `npm run typecheck` + `npm run build`
