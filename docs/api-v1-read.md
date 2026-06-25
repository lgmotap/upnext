# Read API v1 (UpNext)

Owner-managed keys at `/app/settings/api`. All endpoints require:

```http
Authorization: Bearer unx_live_<secret>
```

Rate limit: **120 requests / minute** per key.

## Response envelope

List endpoints return:

```json
{
  "data": [ ... ],
  "next_since": "2026-06-24T12:00:00.000Z"
}
```

Single-resource and catalog endpoints return `{ "data": ... }`. Availability includes `meta`:

```json
{
  "data": [ { "date": "2026-06-25", "time": "09:00", "startAt": "...", "endAt": "..." } ],
  "meta": { "date": "2026-06-25", "serviceId": "...", "timeZone": "America/New_York" }
}
```

Errors:

```json
{ "error": { "code": "UNAUTHORIZED", "message": "..." } }
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/bookings` | Booking requests (`since`, `limit`) |
| GET | `/api/v1/customers` | Customers (`since`, `limit`) |
| GET | `/api/v1/services` | Primary + addon services (`since`, `limit`) |
| GET | `/api/v1/extras` | Add-on services only (`since`, `limit`) |
| GET | `/api/v1/availability` | Slots for a day — `date`, `serviceId`, optional `durationMinutes`, `addonIds` |
| GET | `/api/v1/frequencies` | Frequency options + per-service discount metadata |
| GET | `/api/v1/categories` | Service groups (primary vs add-ons) |
| GET | `/api/v1/company` | Public business profile fields |
| GET | `/api/v1/settings` | Read-only booking policies (notice, buffer, carry-over) |
| GET | `/api/v1/custom-fields` | Active custom booking form fields |

## Webhooks

Outbound events (configure at `/app/settings/api`):

- `booking_created`
- `booking_accepted`
- `booking_canceled`
- `job_completed`
- `customer_created`
- `payment_paid`

HMAC signature header: `UpNext-Signature`.

Smoke: `npm run smoke:api`
