# Sprint 38 — CRM customer depth (tabs + tags)

> Closes CL Part 7 partial gaps without quotes/invoices modules.  
> Audit: `docs/audits/product-gaps-roadmap.md` § CRM

## Current state

- List: table, search, sort, pagination, LTV (`/app/customers`)
- Detail: single page — stats, jobs, notes modal, addresses, portal link, book again (`/app/customers/[customerId]`)
- `Customer.tags String[]` in schema — no edit UI
- Comms: org-wide `/app/communications`

## Scope

### Customer detail tabs

- [x] Tab nav on detail page: **Overview** | **Jobs** | **Addresses** | **Notes** | **Payments**
- [x] Overview: contact, tags, LTV, quick actions (reuse `CustomerDetailActions`)
- [x] Jobs: existing job history table (move from scroll)
- [x] Addresses: list + add modal (existing actions)
- [x] Notes: notes modal inline or tab content
- [x] Payments: link to related `PaymentRecord` rows for this customer (read-only)

### Tags

- [x] Add/remove tags on customer detail (comma or chip input)
- [x] `updateCustomerTagsAction` + validator
- [x] Optional: filter customers list by tag (single-tag filter sufficient)

### Per-customer communications

- [x] Filter `/app/communications` by `customerId` query param OR embedded section on customer Payments/Overview tab
- [x] Link from customer detail → filtered comms log

## Out of scope

- Quotes / invoices tabs (P2 defer)
- Saved payment methods admin view (portal has cards; owner view optional later)
- Customer segments / marketing lists

## Validation

- [x] Extend `scripts/smoke-crm-lists.ts` or new `smoke:customer-detail`
- [x] `npm run typecheck` + `npm run build`
