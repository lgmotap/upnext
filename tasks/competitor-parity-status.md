# ConvertLabs parity — status snapshot

**As of:** 2026-06-25 (post sprints 09–13, browser audit)  
**Baseline research:** `competitor-research/targets/convertlabs/reports/gap-analysis.md` (2026-06-24 — **stale**, use this doc for current status)  
**Full audit plan:** `tasks/competitor-parity-audit-plan.md`

---

## Executive summary

| Dimension | vs ConvertLabs | UpNext position |
|-----------|----------------|-----------------|
| **Core loop** (book → job → crew → pay) | ~90% | **Shipped** — smokes green |
| **Owner daily ops** | ~75% | Strong; missing drag scheduler, quotes, dispatch board |
| **Crew web** | **Ahead** on checklist + photos | CL web portal thinner than UpNext `/crew` |
| **Customer portal** | ~70% | v1 shipped (magic link); no saved cards, password login |
| **Public booking** | ~90% | Frequency + embed + bed/bath pricing params |
| **Platform / API** | ~15% | Intentionally deferred |
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
| Availability + slots | Rules + provider carry-over | Org rules + blackouts | ✅ (no per-worker) |
| Booking inbox accept/decline | `/booking/bookings` | `/app/bookings` | ✅ |
| Owner manual booking | 10-tab wizard | `/app/bookings/new` + frequency | 🟡 (slimmer, no payment tab) |
| Calendar | Week + Scheduler tab | Week view + week nav | 🟡 (no drag-drop) |
| Job list + detail | Deep drawer | `/app/jobs`, `/app/jobs/[id]` | ✅ |
| Assign provider | Wizard tab | Job detail + team | ✅ |
| Reschedule | Owner + portal | Job + pending booking modal | ✅ |
| Job lifecycle | Check-in/out + OTW/late | scheduled → in_progress → completed + OTW/late | ✅ |
| Payment at booking | Stripe on form | Payment link post-job | 🟡 (MVP by design) |
| Payment status tracking | Dashboard + invoices | PaymentRecord + `/app/payments` | ✅ |
| Email notifications | 3 audiences | 8 types + NotificationLog + cron | ✅ |
| Dashboard | Widgets | Real data + Getting Started | ✅ |
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
| Per-worker availability | Grid | Org-level only | ➖ P1 |
| Embedded map | In drawer | Directions link only | 🟡 |

### 3. Customer-facing

| Capability | CL | UpNext | Status |
|------------|-----|--------|--------|
| Customer portal | Email/password, 3 tabs | Magic link `/my/[slug]` | 🟡 |
| Book Again prefilled | Portal tab | Portal + `?prefill=` + query params | ✅ |
| Booking history | Table + cancel | Dashboard tab + owner cancel | 🟡 (portal cancel policy-bound) |
| Saved payment methods | Stripe cards tab | Not built | ❌ P1 |
| Public booking ICS | Unknown | Confirmation `.ics` | ✅ |
| Custom domain booking | Domains + WP | `/book/[slug]` on UpNext domain | 🟡 P1 |
| Website builder | WordPress hub | Not built | ➖ P2 |

### 4. CRM, team, settings

| Capability | CL | UpNext | Status |
|------------|-----|--------|--------|
| Customer list + detail | 7 tabs | List + detail + notes/address | 🟡 |
| Multiple addresses | Yes | Schema + UI modals | ✅ |
| Team / providers | CRUD + magic link | `/app/team` + invite flow | ✅ |
| RBAC tiers | Admin/staff/viewer | owner/admin/dispatcher/worker/viewer | ✅ |
| Settings — business | `/company` | Wired `/app/settings/business` | ✅ |
| Settings — notifications | 3 audiences | 6 toggles persisted | ✅ |
| Settings — portals | Booking + customer URLs | Portals tab + BookingLinkCard | ✅ |
| Settings — billing | SaaS + Connect | Stripe Connect UI | ✅ |
| Reports | `/booking/reports` | `/app/reports` v1 | 🟡 (basic vs CL depth) |
| Quotes / invoices / discounts | Full modules | Not built | ➖ P2 |
| API + webhooks | v1 read + 5 events | Not built | ➖ P1 |

### 5. Onboarding & activation

| Capability | CL | UpNext | Status |
|------------|-----|--------|--------|
| Industry wizard | 4-step + AI name | Onboarding + catalog seed | 🟡 **W** (simpler) |
| Getting Started % | `/get-started` | Dashboard checklist | ✅ |
| Copy booking link | Checklist CTA | Settings + dashboard + Portals | ✅ |
| Stripe Connect in checklist | Yes | Settings billing | ✅ |

---

## Gaps that matter for sales ("same as ConvertLabs")

### Must close for credible parity (P1 — next sprints)

1. **Recurring engine** — frequency stored but no auto job generation
2. **Pricing parameters** — cleaning vertical (bed/bath/sq ft)
3. **Customer portal** — saved cards, cancel policy UI, password option
4. **Pay-at-booking** (optional) — or clear positioning vs payment link
5. **Per-worker availability** — for multi-crew scheduling
6. **CSV customer import**
7. **Custom domain** for `/book/[slug]`

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

Execute **`tasks/competitor-parity-audit-plan.md`** part by part. Update this file after each part completes.
