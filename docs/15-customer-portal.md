# Customer Portal (v1)

Magic-link portal for returning customers — optional password login. Scoped to one business (`organizationId`) and one customer email.

## Routes

| Route | Purpose |
|-------|---------|
| `/my/[businessSlug]` | Magic link or password sign-in |
| `/my/[businessSlug]/forgot-password` | Password reset request (when password login enabled) |
| `/my/[businessSlug]/auth/[token]` | Verify magic token → session cookie (24h) |
| `/my/[businessSlug]/auth/recovery` | Supabase recovery callback |
| `/my/[businessSlug]/set-password` | Set password after recovery |
| `/my/[businessSlug]/dashboard` | History · Book again · Payments |

## Owner configuration

**Settings → Portals** — enable/disable portal, optional password login, FAQ editor (Book again sidebar), copy portal URL.

**Customer profile** — **Send portal link** emails a 15-minute magic link. When password login is enabled, first invite also provisions a Supabase portal user and sends password setup email.

## Password login (optional)

Off by default. When enabled:

- `Customer.portalUserId` links to a Supabase auth user with `user_metadata.role = portal_customer` (not an org Membership).
- Password sign-in verifies via Supabase, then issues the same HTTP-only portal session cookie (Supabase session is cleared immediately).
- Forgot password uses Supabase recovery email.

## Book again prefill

Signed `?prefill=` token on `/book/[slug]` prefills contact + address (7-day TTL). Used from portal and owner **Book again** button.

## FAQ sidebar

Up to 8 Q&A items in **Settings → Portals**. Shown on the **Book again** tab. Cleaning businesses get 3 starter FAQs if none configured.

## Reschedule (customer)

On **Booking history**, upcoming visits within `minNoticeHours` show **Reschedule** (same notice window as cancel). Modal uses the same slot engine as owner reschedule (availability + conflict checks). Confirmation email via `notifyJobRescheduled` / `notifyBookingRescheduled`.

## Cleaning plan sidebar

**Book again** tab shows a read-only summary: last/upcoming service, frequency, address, next visit — from portal booking history.

## Security

- Rate limits on magic-link and password requests (IP + email)
- Token TTL 15 minutes; HTTP-only session cookie 24 hours
- Customers see only their own bookings and payments for that org
- Portal disabled when `BusinessProfile.customerPortalEnabled` is false

## Notifications

- `customer_portal_link` — magic link email
- `booking_cancelled_by_customer` — customer + owner on portal cancel

Smokes: `npm run smoke:customer-portal` · `smoke:portal-password` · `smoke:portal-faq` · `smoke:portal-reschedule`

