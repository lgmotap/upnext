# Sprint 17 — CRM import

> CL: customer import. UpNext backlog item.

## CSV import

- [ ] `/app/customers/import` — upload CSV (firstName, lastName, email, phone, address fields)
- [ ] Zod validation + row errors report
- [ ] Dedupe by email within org
- [ ] Rate limit + max rows (e.g. 500)

## UI

- [ ] Download template CSV
- [ ] Import summary (created, updated, skipped)

## Validation

- [ ] `npm run smoke:customer-import`
