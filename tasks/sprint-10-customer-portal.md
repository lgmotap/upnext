# Sprint 10 — Customer portal v1

> CL reference: `competitor-research/targets/convertlabs/reports/customer-portal.md`  
> UpNext approach: **magic link** (no password) — simpler than CL email/password; scoped to one business + one customer email.

## Schema

- [x] `BusinessProfile.customerPortalEnabled` (default true)
- [x] `CustomerPortalToken` — `customerId`, `organizationId`, `token`, `expiresAt`, `usedAt?`
- [x] `Customer.portalLastLoginAt`

## Owner settings (Portals tab — extend sprint 09)

- [x] Toggle **Enable customer portal**
- [x] Show portal URL: `{APP_URL}/my/{publicSlug}`
- [x] “Send portal link” action on customer detail (email via Resend)
- [x] Help text: customers get magic link; no account password

## Customer routes

```
/my/[businessSlug]              — enter email → send magic link
/my/[businessSlug]/auth/[token] — verify token → session cookie
/my/[businessSlug]/dashboard    — authenticated shell (3 tabs)
```

- [x] All routes implemented

## Tab 1 — Book Again

- [x] Prefill contact + default address from `Customer` + `CustomerAddress`
- [x] Signed `?prefill=` on `/book/[slug]` for public booking form
- [x] Deep link from owner CRM Book again + portal tab

## Tab 2 — Booking history

- [x] Table: date, address, services, status
- [x] Row actions: **Book again**, **Cancel** (upcoming pending/accepted)
- [x] Cancel → notify owner + customer email

## Tab 3 — Payments (MVP slice)

- [x] List outstanding `PaymentRecord` for customer
- [x] “Pay now” → existing Stripe payment link when configured
- [x] Defer saved cards / Stripe Customer object to sprint 12

## Security

- [x] Rate-limit `/my/*` email send (per IP + per email)
- [x] Token TTL 15 min; session cookie 24h
- [x] Customer sees only own `organizationId` + `customerId` data
- [x] Deny portal when `customerPortalEnabled` is false

## Notifications

- [x] Email template: `customer_portal_link`
- [x] Log in `NotificationLog`

## Smoke

- [x] `npm run smoke:customer-portal`

## Docs

- [x] `docs/15-customer-portal.md`
- [x] Update `docs/02-mvp-scope.md` — portal in beta v2
