# ConvertLabs parity — status snapshot

**As of:** 2026-06-25 (Phase 4 complete; Phase 5 **43–44** next)  
**Baseline research:** `competitor-research/targets/convertlabs/reports/gap-analysis.md` (2026-06-24 — **stale**, use this doc for current status)  
**Profile gaps:** `docs/audits/business-profile-gaps.md`  
**Full gap map:** `docs/audits/product-gaps-roadmap.md`  
**Full audit plan:** `tasks/competitor-parity-audit-plan.md`

---

## Executive summary

| Dimension | vs ConvertLabs | UpNext position |
|-----------|----------------|-----------------|
| **Core loop** (book → job → crew → pay) | ~90% | **Shipped** — smokes green |
| **Owner daily ops** | ~85% | Strong; dashboard CL parity in **43–44** |
| **Crew web** | **Ahead** on checklist + photos | CL web portal thinner than UpNext `/crew` |
| **Customer portal** | ~80% | v1 + cancel policy + saved Stripe cards |
| **Public booking** | ~90% | Frequency + embed + bed/bath pricing params |
| **Platform / API** | ~75% | v1 read + webhooks + expansion (sprint 27) |
| **Onboarding / company profile** | ~90% | Places, industry cards, logo, service area — **35–36 done** |
| **Website / marketing** | 0% | Intentionally out of scope |

**Launch blocker:** Resend production domain only (`tasks/launch-checklist.md`).

---

## Scorecard by area

Legend: ✅ parity · 🟡 partial · ❌ missing · ➖ intentional defer · **W** wedge (UpNext better)

### 1. Core operating loop

| Capability | CL | UpNext | Status |
|------------|-----|--------|--------|
| Public multi-step booking | 10-section scroll form | `/book/[slug]` + `/embed` | ✅ |
| Service catalog + add-ons | Service Studio | Industry catalogs + addons | ✅ **W** (faster setup) |
| Frequency / recurring | How Often? + discounts | JobSeries + daily cron | ✅ |
| Pricing parameters (bed/bath) | Unit ranges | ServicePricingParameter + booking flows | ✅ |
| Availability + slots | Rules + provider carry-over | Org rules + per-worker intersection | ✅ |
| Booking inbox accept/decline | `/booking/bookings` | `/app/bookings` | ✅ |
| Owner manual booking | 10-tab wizard | `/app/bookings/new` + frequency | 🟡 **40** |
| Calendar | Week + Scheduler tab | Week view + `/calendar/scheduler` drag board | ✅ sprint 31 |
| Job list + detail | Deep drawer | `/app/jobs`, `/app/jobs/[id]` | ✅ |
| Assign provider | Wizard tab | Job detail + team | ✅ |
| Reschedule | Owner + portal | Job + pending booking modal | ✅ |
| Job lifecycle | Check-in/out + OTW/late | scheduled → in_progress → completed + OTW/late | ✅ |
| Payment at booking | Stripe on form | Optional toggle (off by default) | ✅ sprint 24 |
| Payment status tracking | Dashboard + invoices | PaymentRecord + `/app/payments` | ✅ |
| Email notifications | 3 audiences | 8 types + NotificationLog + cron | ✅ |
| Dashboard | Widgets | Real data + Getting Started; **43–44** ops queues + analytics | 🟡 **43–44** |
| Global search ⌘K | Header | CommandPalette | ✅ |

### 2. Field / crew

| Capability | CL web | UpNext `/crew` | Status |
|------------|--------|----------------|--------|
| Assigned jobs list | My Jobs | `/crew` | ✅ |
| Job detail + directions | Drawer | `/crew/jobs/[id]` | ✅ |
| Check-in timer | Check-In hours | `checkedInAt` + timer | ✅ **W** |
| Checklist | Native app only | Per-service template | ✅ **W** |
| Job photos | Native app only | 1–5 upload + signed URLs | ✅ **W** |
| On The Way / Running Late | Drawer actions | Crew buttons + email | ✅ |
| Open Jobs self-claim | Tab exists | Dispatcher assign only | ➖ P1 |
| Per-worker availability | Grid | `/app/team/[id]/availability` + manual booking filter | ✅ |
| Embedded map | In drawer | Google Maps embed on crew job | ✅ sprint 28 |

### 3. Customer-facing

| Capability | CL | UpNext | Status |
|------------|-----|--------|--------|
| Customer portal | Email/password, 3 tabs | Magic link + optional password | 🟡 sprint 26 |
| Book Again prefilled | Portal tab | Portal + `?prefill=` + query params | ✅ |
| Booking history | Table + cancel | Dashboard tab + owner cancel | 🟡 (portal cancel policy-bound) |
| Saved payment methods | Stripe cards tab | Portal Payments tab | ✅ sprint 16 |
| Public booking ICS | Unknown | Confirmation `.ics` | ✅ |
| Custom domain booking | Domains + WP | Verified custom host routing | ✅ sprint 25 |
| Website builder | WordPress hub | Not built | ➖ P2 |

### 4. CRM, team, settings

| Capability | CL | UpNext | Status |
|------------|-----|--------|--------|
| Customer list + detail | 7 tabs | List + detail + notes/address | 🟡 **38** |
| Multiple addresses | Yes | Schema + UI modals | ✅ |
| Team / providers | CRUD + magic link | `/app/team` + invite flow | ✅ |
| RBAC tiers | Admin/staff/viewer | owner/admin/dispatcher/worker/viewer | ✅ |
| Settings — business | `/company` | Sectioned form + logo + website + service area | ✅ sprint 35 |
| Settings — notifications | 3 audiences | 6 toggles persisted | ✅ |
| Settings — portals | Booking + customer URLs | Portals tab + BookingLinkCard | ✅ |
| Settings — billing | SaaS + Connect | Stripe Connect UI | ✅ |
| Reports | `/booking/reports` | `/app/reports` v1 | 🟡 **37** |
| Communication log | Email history | `/app/communications` | ✅ sprint 33 |
| Quotes / invoices / discounts | Full modules | Not built | ➖ P2 |
| API + webhooks | v1 read + 5 events | `/api/v1/*` + webhooks + expansion | ✅ sprint 20 + 27 |

### 5. Onboarding & activation

| Capability | CL | UpNext | Status |
|------------|-----|--------|--------|
| Industry wizard | 4-step + Places + cards | 4-step + catalog + Places/cards | ✅ **35–36** |
| Company logo / website | On `/company` | Upload + public booking display | ✅ sprint 35 |
| Service area UX | Location-driven | Coverage selector (onboarding + settings) | ✅ sprint 35 |
| Getting Started % | `/get-started` | Dashboard checklist | ✅ |
| Copy booking link | Checklist CTA | Settings + dashboard + Portals | ✅ |
| Stripe Connect in checklist | Yes | Settings billing | ✅ |

---

## Gaps that matter for sales ("same as ConvertLabs")

### Closed in sprints 14–21 ✅

1. Recurring JobSeries + cron — sprint 14  
2. Pricing parameters bed/bath — sprint 15 (half-bath/sq ft → **sprint 23**)  
3. Portal cancel + saved cards — sprint 16 (password → **sprint 26**)  
4. CSV customer import — sprint 17  
5. Per-worker availability — sprint 18  
6. Read API + webhooks — sprint 20  
7. Custom domain doc — sprint 21 (host routing → **sprint 25**)

### P1 — scheduled (sprints 22–31) ✅ complete

See `tasks/full-product-roadmap.md` Phase 2.

### Phase 3 — company profile & onboarding (sprints 35–36)

| Sprint | Gap |
|--------|-----|
| 35 | Service area unify; logo upload; website URL |
| 36 | Google Places; industry cards; sign-up/name dedup |

Detail: `docs/audits/business-profile-gaps.md`

### Phase 4 — ops polish (sprints 37–42)

| Sprint | Gap | Status |
|--------|-----|--------|
| 37 | Reports date range + CSV export | ✅ |
| 38 | Customer tabs + tags | ✅ |
| 39 | Bookings inbox pagination/filters/bulk | ✅ |
| 40 | Manual booking fields + payment + review | ✅ |
| 41 | Calendar month view + conflict hints | ✅ |
| 42 | Portal reschedule + Book Again polish | ✅ |

Detail: `docs/audits/product-gaps-roadmap.md`

### Phase 5 — dashboard parity (sprints 43–44)

| Sprint | Gap |
|--------|-----|
| 43 | CL ops KPI queues, deep links, today enrichment, crew activity |
| 44 | 30d snapshot, time-aware greeting, post-checklist business row |

Audit: `canvases/dashboard-vs-convertlabs.canvas.tsx`

### Already ahead (say it in sales)

- Crew web checklist + photos (CL web lacks both)
- Focused nav (~10 working modules vs 15+)
- Industry catalog seed on onboarding
- Magic-link portal (no password friction)

### Do not build (position against CL)

- Website builder, marketing campaigns, quotes pipeline, gift cards, payouts, multi-location, native apps

---

## Validation run (2026-06-25)

| Command | Result |
|---------|--------|
| `npm run typecheck` | ✅ |
| `npm run db:validate` | ✅ |
| `npm run lint` | run at commit time |
| `npm run smoke:launch` | ✅ |
| `npm run test:e2e` | ✅ 8 tests |
| `npm run smoke:reports` | ✅ |
| `npm run smoke:customer-portal` | ✅ |
| Browser audit (portal, calendar, reports) | ✅ fixes shipped sprint 13 |

---

## Next step

Execute **Phase 5** starting with **`tasks/sprint-43-dashboard-ops-parity.md`** (detailed plan inside). Production gate (owner): Resend domain — `tasks/launch-checklist.md`.
