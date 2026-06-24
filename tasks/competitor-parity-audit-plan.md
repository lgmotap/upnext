# ConvertLabs parity — extensive audit plan

**Created:** 2026-06-25  
**Purpose:** Systematic, part-by-part gap analysis between ConvertLabs research and UpNext **as built** — not another crawl.  
**Living status:** `tasks/competitor-parity-status.md` (update after each part)  
**Research sources (local):** `competitor-research/targets/convertlabs/reports/`  
**MVP boundary:** `docs/02-mvp-scope.md`

---

## How to use this plan

1. Work **one part at a time** — do not skip verification steps.
2. For each row: mark `✅` parity · `🟡` partial · `❌` gap · `➖` intentional defer · `W` wedge.
3. Record evidence: route URL, smoke script, screenshot path, or code path.
4. Update `tasks/competitor-parity-status.md` § for that part when done.
5. Promote `❌` gaps into `tasks/backlog.md` or a new sprint file with priority.
6. **No new competitor crawls** unless a row says `needs CL spec` and blocks a build decision.

**Estimated total effort:** 3–5 working days (one engineer), or 6–8 short agent sessions.

---

## Part 0 — Baseline & tooling (½ day)

### Goals
- Freeze research inventory and UpNext route map.
- Ensure all smoke scripts run green.

### CL sources
- `gap-analysis.md`, `upnext-mvp-recommendations.md`, `page-map.md`

### UpNext artifacts
- `tasks/mvp-traceability.md`
- `tasks/launch-checklist.md`
- `package.json` scripts (`smoke:*`)

### Verification commands (all must pass)
```bash
npm run db:validate
npm run typecheck
npm run smoke:launch
npm run test:e2e
npm run smoke:customer-portal
npm run smoke:portal-links
npm run smoke:public-booking-parity
npm run smoke:reports
```

### Deliverable
- [ ] `tasks/competitor-parity-status.md` — executive summary confirmed
- [ ] List of smoke scripts with one-line coverage note (table in Part 0 appendix)

---

## Part 1 — Public booking flow (½ day)

### CL reference
- `public-booking-standalone.md` — 10 sections: Contact, Address, Services, Extras, Date/Time, Frequency, Additional info, Payment, Summary
- Screenshots: `targets/convertlabs/screenshots/` (marketing + public booking if captured)

### UpNext routes
| Step | Route / component |
|------|-------------------|
| Landing | `/book/[slug]` |
| Embed | `/book/[slug]/embed` |
| Confirmation | `/book/[slug]/confirmation/[id]` |
| Prefill | `?prefill=` + unsigned query params |

### Browser checklist (use `smoke-test-co` org)
- [ ] Service selection + price updates
- [ ] Add-on toggles update total/duration
- [ ] Frequency step (one-time / weekly / bi-weekly / monthly)
- [ ] Calendar shows unavailable vs bookable days
- [ ] Slot picker populates after date
- [ ] Form validation + error banner (`?error=`)
- [ ] Empty state when no public services
- [ ] Confirmation: ICS download, portal link, frequency display
- [ ] Embed route minimal chrome

### Automated
- `npm run smoke:public-booking-parity`
- `npm run smoke:e2e` (creates booking)

### Gap rows to score
| CL section | UpNext | Notes |
|------------|--------|-------|
| Payment at book | Payment link post-accept | MVP by design — document positioning |
| Pricing parameters | Flat + addons | P1 vertical gap |
| Additional info fields | `customerNotes` only | Compare field list |
| Summary step | Inline on form | UX difference OK? |
| Stripe Connect gate | N/A at book | |

### Deliverable
- [ ] Part 1 section in `competitor-parity-status.md`
- [ ] Screenshot set in `docs/audits/part-01-public-booking/` (optional)

---

## Part 2 — Owner booking ops (1 day)

### CL reference
- `app-coverage.md` — Bookings module, `app-bookings-new` wizard
- `user-flows.md` — Admin creates booking, accept flow
- `forms-and-fields.md` — booking fields sample

### UpNext routes
- `/app/bookings` — inbox list
- `/app/bookings/[id]` — detail, accept/decline, reschedule
- `/app/bookings/new` — manual booking (customer, service, frequency, slot, assign)
- `/app/calendar` — week view
- `/app/jobs`, `/app/jobs/[id]` — post-accept

### Browser checklist
- [ ] Pending request → accept → job created
- [ ] Decline with confirm modal
- [ ] Reschedule pending booking (modal, slots)
- [ ] Reschedule job (conflict-aware)
- [ ] Manual booking end-to-end (phone customer)
- [ ] Frequency shown on booking detail
- [ ] Assign worker from job detail
- [ ] Calendar week nav + job chips link to detail
- [ ] ⌘K finds customer/job/booking by name

### Automated
- `npm run smoke:e2e`
- `npm run smoke:manual-booking`
- `npm run smoke:scheduling`
- `npm run smoke:global-search`

### Gap rows to score
| CL capability | Verify |
|---------------|--------|
| 10-tab admin wizard | Slimmer manual booking — list missing tabs |
| Drag-drop scheduler | Not built |
| Recurring series | Frequency only — no JobSeries |
| Booking detail timeline | Status + links — compare depth |
| Bulk inbox actions | Not built |

### Deliverable
- [ ] Part 2 section updated
- [ ] Any `❌` → backlog item with P0/P1

---

## Part 3 — Services & availability (½ day)

### CL reference
- Service Studio (services, addons, frequencies tab, pricing parameters)
- Settings → Time & Scheduling

### UpNext routes
- `/app/services` — CRUD, grouped catalog, load suggested
- `/app/settings/availability` — weekly rules, blackouts
- Onboarding step — catalog preview

### Browser + code checklist
- [ ] Create/edit/archive service
- [ ] Addon linked to primary service
- [ ] Checklist template editor per service
- [ ] Availability rules affect public slots (cross-check smoke)
- [ ] `bookingEnabled` / min notice / max days ahead if exposed
- [ ] Industry catalog matches CL cleaning extras count (spot-check)

### Automated
- `npm run smoke:industry-catalog`
- `npm run smoke:booking`

### Gap rows
- Pricing parameters matrix
- Service-level frequency discounts
- Per-provider carry-over / buffers

---

## Part 4 — Crew / field workflow (½ day)

### CL reference
- `provider-job-workflow.md` — Check-In, On The Way, Running Late, Check-Out
- Help articles on native app features

### UpNext routes
- `/crew` — worker job list
- `/crew/jobs/[id]` — check-in timer, checklist, photos, OTW/late, complete

### Browser checklist (worker session)
- [ ] Worker cannot access `/app/*`
- [ ] Only assigned jobs visible
- [ ] Check-in → elapsed timer
- [ ] Checklist toggle persists
- [ ] Photo upload 1–5
- [ ] On The Way / Running Late (customer email logged)
- [ ] Complete job → owner sees status

### Automated
- `npm run smoke:launch-crew`
- `npm run smoke:checklist` / `smoke:job-photos` if present

### Wedge verification
- [ ] Document CL **web** portal lacks checklist + photos — UpNext **W**

---

## Part 5 — Payments & revenue (½ day)

### CL reference
- Settings → Payment, public form payment step
- Dashboard awaiting payment, invoices module (P2 compare only)

### UpNext routes
- `/app/payments`
- `/app/jobs/[id]` — Send payment link, mark paid
- `/app/settings/billing` — Stripe Connect
- `/app/reports` — revenue aggregates
- `/api/webhooks/stripe`

### Browser + automated
- [ ] Connect Stripe (or connected state)
- [ ] Send payment link from job
- [ ] Checkout session (smoke:stripe)
- [ ] Webhook idempotency
- [ ] Manual mark paid
- [ ] Dashboard + reports revenue match

### Commands
- `npm run smoke:launch-payment`
- `npm run smoke:stripe-payments`
- `npm run smoke:reports`

### Gap rows
- Pay at booking vs link
- Saved customer cards
- Invoices / quotes (P2)
- Provider payouts (P2)

---

## Part 6 — Customer portal (½ day)

### CL reference
- `customer-portal.md` — 3 tabs, password login, cancel, cards

### UpNext routes
- `/my/[slug]` — magic link request
- `/my/[slug]/auth/[token]`
- `/my/[slug]/dashboard` — History, Book again, Payments
- Settings → Portals toggle

### Browser checklist
- [ ] Portal enabled/disabled respected
- [ ] Magic link email (Resend sandbox)
- [ ] Session cookie 24h
- [ ] Book again → prefilled `/book/[slug]`
- [ ] Payment tab shows outstanding
- [ ] Rate limit on link requests

### Automated
- `npm run smoke:customer-portal`
- `npm run smoke:portal-links`

### Gap rows
- Password login vs magic link
- Portal cancel upcoming booking
- Saved cards tab
- Cleaning Plan sidebar (CL Book Again)

---

## Part 7 — CRM & customers (½ day)

### CL reference
- Customer 7 tabs: Overview, Notes, Bookings, Quotes, Invoices, Addresses, Payment Methods

### UpNext routes
- `/app/customers`, `/app/customers/[id]`
- Notes modal, add address, Send portal link, Book again

### Checklist
- [ ] Customer created on public book
- [ ] Lifetime value / booking history
- [ ] Notes persist
- [ ] Multiple addresses
- [ ] Missing tabs: quotes, invoices, payment methods

### Gap rows
- CSV import
- Tags / segments
- Communication log

---

## Part 8 — Team, RBAC & security (½ day)

### CL reference
- `provider-job-workflow.md`, team settings
- `tasks/sprint-08-security-review.md`

### Verification
- [ ] Roles: owner, admin, dispatcher, worker, viewer — `server/permissions/can.ts`
- [ ] Worker → `/crew` only
- [ ] Tenant isolation — org-scoped queries
- [ ] Public routes rate-limited
- [ ] RLS enabled (Supabase)
- [ ] Team invite flow → worker

### Automated
- `npm run smoke:team-invite`
- `npm run smoke:launch-crew`
- Playwright: `/app` redirects unauthenticated

### Gap rows
- Providers Activity board
- Open Jobs pool
- Per-worker availability

---

## Part 9 — Notifications & comms (½ day)

### CL reference
- Settings → Notifications (customer, provider, admin audiences)
- Help center notification articles (sample)

### UpNext
- `server/services/notifications.ts` — 8 email types
- `NotificationLog` audit
- `/app/settings/notifications` — 6 toggles
- `/api/cron/reminders`

### Checklist
- [ ] Each toggle disables sender when off
- [ ] Booking confirm, accept, assign, reschedule, cancel, payment, portal link, team invite
- [ ] Reminder cron 24h/2h
- [ ] OTW / Running late customer emails

### Commands
- `npm run smoke:e2e` (notification log count)
- `npm run smoke:scheduling`

### Launch gate
- [ ] Resend prod domain — owner action

---

## Part 10 — Onboarding & activation (½ day)

### CL reference
- `onboarding-wizard.md`, Getting Started checklist

### UpNext routes
- `/sign-up`, `/app/onboarding`
- Dashboard Getting Started checklist
- Industry catalog seed

### Checklist
- [ ] Sign-up → org + profile provisioned
- [ ] Onboarding saves business profile
- [ ] Catalog seeded per industry
- [ ] Checklist % completes when: profile, service, availability, booking link shared
- [ ] Time to copy booking link < 15 min (manual timing)

### Commands
- `npm run smoke:launch-onboarding`

### Wedge
- [ ] Simpler than CL 4-step + WP + domain checklist

---

## Part 11 — Settings & platform surfaces (½ day)

### CL reference
- `navigation-map.md` — settings tree, profile menu
- `pricing-and-limits.md` — plan limits

### UpNext settings tabs
- Business, Portals, Availability, Notifications, Billing

### Checklist
- [ ] Each tab saves and reloads correctly
- [ ] BookingLinkCard on business + portals
- [ ] Legal `/privacy`, `/terms`
- [ ] PostHog + Sentry wired (env-gated)
- [ ] Marketing `/` untouched

### Compare CL settings we **omit** (document as P2)
- Forms builder, Integrations hub, Domains, Marketing

---

## Part 12 — Integrations & API (¼ day — defer heavy build)

### CL reference
- `api-reference.md`, `integrations-map.md`

### UpNext
- Stripe webhook only in MVP

### Scorecard only (no build)
- Read API, webhooks, Zapier, iCal, API keys
- Mark all ➖ P1 unless design partner needs

---

## Part 13 — Intentional omissions & positioning (¼ day)

### Goal
Sales-ready "why not ConvertLabs" matrix.

### Document
- Website builder → link/embed `/book/[slug]`
- Marketing suite → email ops only
- Quotes/invoices → payment link on job
- Native apps → PWA crew exceeds CL web

### Deliverable
- [ ] One-pager in `docs/audits/competitor-positioning.md` (optional)

---

## Part 14 — Synthesis & roadmap (½ day)

### Inputs
- Parts 0–13 status tables
- `tasks/backlog.md`
- `docs/02-mvp-scope.md`

### Outputs
1. **Updated** `competitor-research/targets/convertlabs/reports/gap-analysis.md` (local only)
2. **Updated** `tasks/competitor-parity-status.md` — final scorecard
3. **Sprint 14+ plan** — prioritized from gaps marked P1
4. **CHANGELOG** + `HANDOFF.md` audit complete note

### Proposed P1 backlog (draft — confirm after audit)
| # | Item | CL module |
|---|------|-----------|
| 1 | Recurring JobSeries + cron | Frequency + Service Studio |
| 2 | Pricing parameters (bed/bath) | Service Studio |
| 3 | Portal saved cards + cancel | Customer portal |
| 4 | CSV customer import | Customers |
| 5 | Custom booking domain | Domains |
| 6 | Per-worker availability | Provider availability |
| 7 | Full Playwright signup→pay E2E | Release standard |
| 8 | Read API + webhooks | API v1 |

---

## Appendix A — Smoke script coverage map

| Script | Covers |
|--------|--------|
| `smoke:launch` | Onboarding, e2e, crew, payment, stripe, search |
| `smoke:e2e` | Public book → accept → job → notifications |
| `smoke:manual-booking` | Owner phone booking |
| `smoke:scheduling` | Reschedule + OTW/late |
| `smoke:customer-portal` | Magic link + dashboard + prefill |
| `smoke:portal-links` | URL helpers |
| `smoke:public-booking-parity` | Frequency, embed, prefill |
| `smoke:global-search` | ⌘K service |
| `smoke:reports` | Reporting aggregates |
| `smoke:industry-catalog` | Onboarding catalog |
| `smoke:team-invite` | Worker invite |
| `test:e2e` | Shell + public booking UI |

## Appendix B — Browser audit template

For each part, log in `docs/audits/browser-log-YYYY-MM-DD.md`:

```markdown
### [Part N] [Area] — [date]
- URL:
- Actor: owner | worker | public
- Pass:
- Fail:
- Screenshot:
- Follow-up issue:
```

## Appendix C — Part completion checklist

| Part | Owner | Date | Status |
|------|-------|------|--------|
| 0 Baseline | | | ⬜ |
| 1 Public booking | | | ⬜ |
| 2 Owner ops | | | ⬜ |
| 3 Services | | | ⬜ |
| 4 Crew | | | ⬜ |
| 5 Payments | | | ⬜ |
| 6 Portal | | | ⬜ |
| 7 CRM | | | ⬜ |
| 8 RBAC | | | ⬜ |
| 9 Notifications | | | ⬜ |
| 10 Onboarding | | | ⬜ |
| 11 Settings | | | ⬜ |
| 12 API | | | ⬜ |
| 13 Positioning | | | ⬜ |
| 14 Synthesis | | | ⬜ |

---

**Rule:** Finish Part 0 before Part 1. Parts 1–11 can run in parallel by different reviewers if they merge status into one file.
