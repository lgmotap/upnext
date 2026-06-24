# Customer Portal (v1)

Magic-link portal for returning customers — no password. Scoped to one business (`organizationId`) and one customer email.

## Routes

| Route | Purpose |
|-------|---------|
| `/my/[businessSlug]` | Enter email → receive magic link |
| `/my/[businessSlug]/auth/[token]` | Verify token → session cookie (24h) |
| `/my/[businessSlug]/dashboard` | History · Book again · Payments |

## Owner configuration

**Settings → Portals** — enable/disable portal, copy portal URL.

**Customer profile** — **Send portal link** emails a 15-minute magic link.

## Book again prefill

Signed `?prefill=` token on `/book/[slug]` prefills contact + address (7-day TTL). Used from portal and owner **Book again** button.

## Security

- Rate limits on magic-link requests (IP + email)
- Token TTL 15 minutes; HTTP-only session cookie 24 hours
- Customers see only their own bookings and payments for that org
- Portal disabled when `BusinessProfile.customerPortalEnabled` is false

## Notifications

- `customer_portal_link` — magic link email
- `booking_cancelled_by_customer` — customer + owner on portal cancel

Smoke: `npm run smoke:customer-portal`
