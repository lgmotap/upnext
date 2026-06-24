# Sprint 20 — Read API + webhooks

> CL: `api-reference.md` — GET sync + 5 webhook events.

## API keys

- [ ] `ApiKey` model — org scoped, hashed secret, name, lastUsedAt
- [ ] `/app/settings/api` — create/revoke keys (owner only)

## Read endpoints (v1)

- [ ] `GET /api/v1/bookings` — list with `since` cursor
- [ ] `GET /api/v1/customers`
- [ ] `GET /api/v1/services`
- [ ] Bearer auth; rate limited

## Webhooks

- [ ] `WebhookEndpoint` model — url, secret, events[]
- [ ] Deliver on: `booking.created`, `booking.accepted`, `job.completed`, `customer.created`, `payment.paid`
- [ ] Retry + delivery log

## Validation

- [ ] `npm run smoke:api`
