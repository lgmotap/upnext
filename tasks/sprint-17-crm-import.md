# Sprint 17 — CRM import

> CL: customer import. UpNext backlog item.

## CSV import

- [x] `/app/customers/import` — upload CSV (firstName, lastName, email, phone, address fields)
- [x] Zod validation + row errors report
- [x] Dedupe by email within org
- [x] Rate limit + max rows (e.g. 500)

## UI

- [x] Download template CSV
- [x] Import summary (created, updated, skipped)

## Validation

- [x] `npm run smoke:customer-import`
