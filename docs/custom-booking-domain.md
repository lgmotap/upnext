# Custom booking domain

Serve public booking at `book.yourbusiness.com` (root path) instead of `https://your-app.com/book/{slug}`.

## Default (no custom domain)

```txt
https://{NEXT_PUBLIC_APP_URL}/book/{publicSlug}
https://{NEXT_PUBLIC_APP_URL}/book/{publicSlug}/embed
```

Copy from **Settings → Portals** or the dashboard booking link card.

## Custom domain (implemented — sprint 25)

When verified, customers visit:

```txt
https://book.yourbusiness.com/          → booking form
https://book.yourbusiness.com/embed     → iframe embed
https://book.yourbusiness.com/confirmation/{id}  → post-checkout confirmation
```

Slug URLs on the main app host continue to work.

### Setup

1. **Settings → Portals → Custom booking domain** — enter `book.yourdomain.com` and save.

2. **DNS** — Add a CNAME:
   ```txt
   book.yourdomain.com  →  cname.vercel-dns.com
   ```
   (Or your Vercel project’s domain target — shown in Settings.)

3. **Vercel** — Add `book.yourdomain.com` as a domain on the UpNext project (Production).

4. **Verify** — Click **Verify DNS** in Settings. On success, `customBookingVerifiedAt` is set and host routing activates.

### How routing works

- `proxy.ts` checks the request `Host` header.
- If it matches a verified `BusinessProfile.customBookingHost`, the path rewrites to `/book/{publicSlug}/…` internally.
- Resolution uses `GET /api/internal/booking-host?host=…` (cached 60s).

### Email & payment links

When the custom host is **verified**, booking confirmation and pay-at-booking checkout success/cancel URLs use the custom host. Customer portal magic links remain on `NEXT_PUBLIC_APP_URL` (`/my/{slug}`).

If `NEXT_PUBLIC_APP_URL` hostname differs from your custom booking host, Settings shows a warning — this is expected when the app dashboard lives on a different domain than booking.

### Env (optional)

```txt
NEXT_PUBLIC_BOOKING_CNAME_TARGET=cname.vercel-dns.com
```

### Smoke test

```bash
npm run smoke:custom-domain
```

### Checklist

- [ ] CNAME points to Vercel
- [ ] Domain added in Vercel project
- [ ] Host saved + **Verify DNS** green in Settings → Portals
- [ ] Test `https://book.yourdomain.com/` and confirmation after pay-at-booking

## Customer portal

Magic-link portal remains at `/my/{slug}` on the app host. A separate `portal.yourdomain.com` can follow the same CNAME + Vercel pattern in a future sprint.
