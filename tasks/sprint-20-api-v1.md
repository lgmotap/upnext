# Sprint 20 — Read API + webhooks

> CL: `api-reference.md` — GET sync + 5 webhook events.

## API keys

- [x] `ApiKey` model — org scoped, hashed secret, name, lastUsedAt
- [x] `/app/settings/api` — create/revoke keys (owner only)

## Read endpoints (v1)

- [x] `GET /api/v1/bookings` — list with `since` cursor
- [x] `GET /api/v1/customers`
- [x] `GET /api/v1/services`
- [x] Bearer auth; rate limited

## Webhooks

- [x] `WebhookEndpoint` model — url, secret, events[]
- [x] Deliver on: `booking.created`, `booking.accepted`, `job.completed`, `customer.created`, `payment.paid`
- [x] Retry + delivery log

## Validation

- [x] `npm run smoke:api`
