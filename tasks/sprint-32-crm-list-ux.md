# Sprint 32 — CRM list UX (scale-ready indexes)

> Replace card grids with dense tables; pagination; hybrid booking inbox.

## Customers

- [x] Table layout (matches Jobs / Payments pattern)
- [x] Search by name, email, phone
- [x] Sort: recent, name A–Z, most jobs
- [x] Pagination (50 per page)
- [x] Last job date column + batched lifetime value query

## Bookings inbox

- [x] Pending requests: card layout with inline accept/decline actions
- [x] Accepted/declined/cancelled: compact history table

## Shared

- [x] `ListPagination` + `lib/pagination.ts` reusable helpers

## Validation

- [x] `npm run smoke:crm-lists`
- [x] `npm run typecheck` + `npm run build`
