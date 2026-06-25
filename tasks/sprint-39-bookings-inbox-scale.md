# Sprint 39 — Bookings inbox scale (filters + pagination)

> Extends sprint 32 hybrid inbox for larger orgs.  
> Audit: `docs/audits/product-gaps-roadmap.md` § Bookings inbox

## Current state

- `/app/bookings` — pending cards + history table; loads all requests via `listBookingRequestsForOrg`
- Per-item accept/decline (`BookingListActions`)
- Customers/jobs use `ListPagination` + `lib/pagination.ts`

## Scope

### Pagination

- [x] Paginate history table (50/page) using shared `ListPagination`
- [x] Pending section: cap display + “show all pending” or paginate if >20

### Filters

- [x] `searchParams`: `status` (pending | accepted | declined | cancelled | all)
- [x] Optional: `q` search customer name/email on history
- [x] Optional: date range on `createdAt` (last 7 / 30 / all)

### Bulk actions (lite)

- [x] Checkbox select on pending cards
- [x] Bulk decline with confirm (bulk accept optional — watch slot conflicts)
- [x] Dispatcher+ permission only

## Out of scope

- Full CL inbox drawer on every row
- Export bookings CSV (reports sprint 37 covers payments/jobs export)

## Validation

- [x] Extend `scripts/smoke-crm-lists.ts` or `smoke:booking` for pagination + filter query
- [x] `npm run typecheck` + `npm run build`
