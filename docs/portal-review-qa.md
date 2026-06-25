# Portal review Q&A + competitor gap analysis

**Date:** 2026-06-24  
**Method:** Local walkthrough (`localhost:3000`) as new owner + synthesis of `competitor-research/targets/convertlabs/`

---

## Executive plan (executed this session)

| Priority | Item | Status |
|----------|------|--------|
| P0 | Sign-in / sign-up submit loading state | **Fixed** — `AuthSubmitButton` with spinner |
| P0 | Shell shows mock business ("Sparkle & Shine") | **Fixed** — real org from DB |
| P0 | Topbar **New** button dead | **Fixed** — dropdown → booking, service, jobs, team |
| P0 | Sidebar booking link wrong slug | **Fixed** — uses `publicSlug` |
| P0 | Bookings nav badge hardcoded "3" | **Fixed** — real pending count |
| P0 | Onboarding missing industry / address / service | **Fixed** — 4-step wizard |
| P0 | Skip onboarding → empty dashboard | **Fixed** — cookie gate + `onboardingCompletedAt` |
| P0 | Jobs page no way to create work | **Fixed** — "New booking" CTA |
| P1 | Search / notifications UI fake | **Disabled** with "coming soon" (honest UX) |
| P1 | `NEXT_PUBLIC_APP_URL` on Vercel | Still needed for production auth/Stripe |

---

## Portal walkthrough Q&A

### Auth

**Q: After sign-up, why does sign-in feel stuck?**  
A: Server actions redirect only after Supabase responds. The submit button had no `pending` state — looked broken. Fixed with loading label + disabled state.

**Q: Can I sign in before email confirm?**  
A: Depends on Supabase project settings. If confirm required, sign-up redirects to sign-in with message.

**Q: Forgot password?**  
A: Works via Resend/Supabase; submit now shows loading state.

### Onboarding (vs ConvertLabs 4-step wizard)

| ConvertLabs | UpNext (before) | UpNext (now) | Planned |
|-------------|-----------------|--------------|---------|
| Industry cards | — | Step 1: service type + team size dropdowns | **Sprint 36** — card grid |
| Google Places location | — | Step 2: street, city, state, ZIP | **Sprint 36** — Places autocomplete |
| Business name | CL: AI suggestions | Step 3: name, TZ, currency, phone (prefill from sign-up) | ➖ **Not planned** — manual name only |
| Service area from location | — | Step 3: coverage selector (matches settings) | ✅ sprint 35 |
| SaaS billing card (skippable) | — | Skipped (not our model) | — |
| Getting Started checklist | — | Dashboard checklist with progress bar | ✅ |
| Seed service catalog | Auto from industry | Full catalog per industry on onboarding | ✅ **Wedge** |

### Settings → Business (vs CL `/company`)

| ConvertLabs | UpNext (now) | Planned |
|-------------|--------------|---------|
| Company identity fields | Sectioned form (industry, address, service area, public profile) | ✅ |
| Logo upload | — | **Sprint 35** — Settings + `/book` header |
| Website URL | — | **Sprint 35** — Settings + booking page link |
| Google Places address | — | **Sprint 36** |
| Branding colors | Separate settings | **Backlog** (P2) |

Full gap matrix: `docs/audits/business-profile-gaps.md`

**Q: Why was onboarding only 2 steps?**  
A: MVP sprint 01 minimized TTFB. Competitor research showed industry + address are expected before first booking.

**Q: What happens if I skip onboarding?**  
A: Now redirected to `/app/onboarding` until completed (cookie + DB timestamp).

### Shell / navigation

**Q: Why does sidebar show "Sparkle & Shine Cleaning"?**  
A: `AppSidebar`, `AppTopbar`, `MobileNav` imported `lib/mock/data` — leftover UI shell. Fixed.

**Q: Why does "View booking page" 404?**  
A: Mock slug `sparkle-shine` ≠ your real `publicSlug`. Fixed.

**Q: What does **New** do?**  
A: Was a dead `<button>`. Now opens menu: New booking, Add service, View jobs, Team.

**Q: What does search work?**  
A: **⌘K CommandPalette** — search customers, jobs, bookings (`components/app/CommandPalette.tsx`, sprint 12).

**Q: What do notifications do?**  
A: **NotificationBell** in topbar — pending bookings badge + recent activity dropdown (`components/layout/NotificationBell.tsx`). Full notification center deferred to backlog P2.

### Operations

**Q: How do I add a job?**  
A: Jobs come from accepted bookings or **Bookings → New booking** (`/app/bookings/new`). Jobs list now has "New booking" CTA.

**Q: Dashboard numbers real?**  
A: Yes — wired in sprint 07 (`getDashboardData`). Empty until bookings exist.

**Q: Accept booking from dashboard?**  
A: Yes — inline accept/decline forms work (server actions).

**Q: Payments / Stripe Connect?**  
A: Built sprint 06; needs `NEXT_PUBLIC_APP_URL` + Stripe keys on Vercel.

**Q: Crew view?**  
A: `/crew` — checklists, photos, timer (sprint 06). Worker must be invited.

### Public booking

**Q: Customer flow?**  
A: `/book/[slug]` — multi-step (contact, address, service, slot). Parity with ConvertLabs standalone form (no frequency/recurring yet).

---

## Detailed gap vs ConvertLabs research

Reference: `competitor-research/targets/convertlabs/reports/gap-analysis.md`, `upnext-mvp-recommendations.md`

### Closed / parity (P0)

- Public multi-step booking
- Service catalog + add-ons
- Availability + slots
- Booking inbox accept/decline
- Calendar week view
- Job list + detail
- Team assignments
- Crew my-jobs + complete
- Customer list + auto-create on book
- Check-in timer, checklist, photos (web — **beats CL web portal**)
- Payments + webhooks (when env configured)
- Notification emails + reminder cron
- Dashboard real data
- Team invites
- Owner manual booking (`/app/bookings/new`)
- **Onboarding industry + address (this session)**

### Still missing vs competitor (prioritized)

#### P0 — launch blockers

| Gap | CL evidence | UpNext note |
|-----|-------------|-------------|
| Production `NEXT_PUBLIC_APP_URL` | Auth redirects, Stripe | Set on Vercel + Supabase redirect URLs |
| Booking detail polish | Owner row actions | Verify status timeline on `/app/bookings/[id]` |
| Job status richness | On The Way, Running Late | Only scheduled → in_progress → completed |

#### P1 — post-first-customer (remaining)

| Gap | CL evidence | UpNext / sprint |
|-----|-------------|-----------------|
| Company logo + website on profile | `/company` | ✅ Sprint 35 |
| Service area UX consistency | Places / structured | ✅ Sprint 35 |
| Google Places on business address | Onboarding step 2 | ✅ Sprint 36 (`AddressAutocompleteFields`) |
| Industry card selection | Onboarding step 1 | ✅ Sprint 36 (`IndustryTypeCards`) |
| Sign-up vs onboarding business-name dedup | — | ✅ Sprint 36 — **Option A** (see `business-profile-gaps.md`) |

#### Phase 4 — ops polish (scheduled)

| Gap | CL evidence | Sprint |
|-----|-------------|--------|
| Reports date range + CSV | `/booking/reports` | **37** |
| Customer detail tabs + tags | 7-tab CRM | **38** |
| Bookings inbox pagination/filters | Bookings module | **39** |
| Manual booking fields + payment step | 10-tab wizard | **40** |
| Calendar month + conflict hints | Calendar | **41** |
| Portal reschedule | Customer portal | **42** |

See `docs/audits/product-gaps-roadmap.md`.

#### P2 — intentional omissions

Website builder, marketing campaigns, quotes, invoices, gift cards, multi-location, native apps, payouts reporting.

### Wedge (UpNext should win)

1. **Focused nav** — 9 items, all functional vs CL 15+ modules  
2. **Crew web** — checklist + photos (CL web lacks these)  
3. **Faster onboarding** — 4 steps + seeded service vs CL wizard + checklist + WP  
4. **Honest shell** — ⌘K search + notification bell (not a full CL notification center)  

---

## Recommended next sprint items

1. **Phase 3:** `tasks/sprint-35-company-profile-parity.md` → sprint 36  
2. **Phase 4:** sprints 37–42 per `docs/audits/product-gaps-roadmap.md`  
3. **Owner:** Resend production domain — `tasks/launch-checklist.md`  
4. Playwright E2E: sign-up → onboarding → book → accept → crew complete (env-gated Stripe)  

---

## Commands to verify

```bash
npx prisma migrate dev
npm run typecheck
npx tsx scripts/smoke-launch-onboarding.ts
```
