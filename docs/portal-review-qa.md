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

| ConvertLabs | UpNext (before) | UpNext (now) |
|-------------|-----------------|--------------|
| Industry cards | — | Step 1: service type + team size |
| Google Places location | — | Step 2: street, city, state, ZIP |
| Business name + AI suggestions | Partial (name only) | Step 3: name, TZ, currency, phone |
| SaaS billing card (skippable) | — | Skipped (not our model) |
| Getting Started checklist | — | **Fixed** — dashboard checklist with progress bar |
| Seed service catalog | Auto from industry | Step 4: suggested service + booking link |

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

**Q: Why doesn't search work?**  
A: Not built (ConvertLabs has ⌘K). Input disabled until implemented.

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

#### P1 — post-first-customer

| Gap | CL evidence |
|-----|-------------|
| Getting Started checklist (% complete) | `/get-started` | **Fixed** — `GettingStartedChecklist` on dashboard |
| Recurring / frequency bookings | "How Often?" step |
| Pricing parameters (beds, sq ft) | Service Studio |
| Customer portal (Book Again, history) | `customer-portal.md` |
| On The Way / Running Late notifications | Provider drawer |
| Worker-specific availability | Provider Availability tab |
| Global search ⌘K | Owner header |
| Public API + webhooks | api.convertlabs.io |

#### P2 — intentional omissions

Website builder, marketing campaigns, quotes, invoices, gift cards, multi-location, native apps, payouts reporting.

### Wedge (UpNext should win)

1. **Focused nav** — 9 items, all functional vs CL 15+ modules  
2. **Crew web** — checklist + photos (CL web lacks these)  
3. **Faster onboarding** — 4 steps + seeded service vs CL wizard + checklist + WP  
4. **No faux modules** — search/notifications disabled honestly vs empty shells  

---

## Recommended next sprint items

1. Set `NEXT_PUBLIC_APP_URL` on Vercel + Supabase auth URLs  
2. ~~Getting Started checklist on dashboard empty state (4–5 tasks)~~ — done  
3. ~~Booking reschedule UX (ConvertLabs frequency / reschedule modals)~~ — done (job + pending request)  
4. ~~Crew "On the way" email button~~ — done (On the way + Running late)  
5. Playwright E2E: sign-up → onboarding → book → accept → crew complete  

---

## Commands to verify

```bash
npx prisma migrate dev
npm run typecheck
npx tsx scripts/smoke-launch-onboarding.ts
```
