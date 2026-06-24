# Custom booking domain

Optional: serve public booking at `book.yourbusiness.com` instead of `upnext.app/book/your-slug`.

## MVP (recommended)

Use the built-in slug URL:

```txt
https://upnext.app/book/{publicSlug}
```

Embed: `https://upnext.app/book/{publicSlug}/embed`

Copy from **Settings → Business** or the dashboard booking link card.

## Custom domain (P1 — manual DNS)

1. **DNS** — Add a CNAME record:
   ```txt
   book.yourdomain.com  →  cname.vercel-dns.com
   ```
   (Or your Vercel project’s configured domain target.)

2. **Vercel** — Add `book.yourdomain.com` as a domain on the UpNext Vercel project (Production).

3. **App URL** — Set `NEXT_PUBLIC_APP_URL=https://book.yourdomain.com` on Production so emails and payment links use the correct host.

4. **Middleware (future)** — Host-based routing to resolve `book.*` → `/book/[slug]` without the `/book/` prefix is not implemented in MVP. Until then, custom domains still work if you redirect:
   ```txt
   book.yourdomain.com  →  https://upnext.app/book/your-slug
   ```
   via Vercel redirect rules or your DNS provider.

## Customer portal

Magic-link portal remains at `/my/{slug}` on the app host. A separate `portal.yourdomain.com` follows the same CNAME + Vercel pattern when implemented.

## Checklist

- [ ] CNAME points to Vercel
- [ ] Domain added in Vercel project
- [ ] `NEXT_PUBLIC_APP_URL` updated on Production
- [ ] Test booking + confirmation email links
