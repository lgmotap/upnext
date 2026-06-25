# Backlog

Unprioritized ideas and **P2 items without a sprint**. Phases **3–5 (sprints 35–44) complete**.  
Master map: `docs/audits/product-gaps-roadmap.md` · Profile gaps: `docs/audits/business-profile-gaps.md`

Promote into a sprint file when scheduling ad-hoc work. Before promoting: check `tasks/mvp-traceability.md`.

## Done (historical)

- On The Way / Running Late customer notifications — batch 3
- Recurring jobs / JobSeries cron — sprint 14
- Customer portal v1 (magic link) — sprint 10
- CSV customer import — sprint 17
- Reporting v1 — sprint 13
- Per-team-member availability — sprint 18
- Pricing parameters bed/bath — sprint 15
- Portal cancel + saved cards — sprint 16
- Read API + webhooks — sprint 20
- Phase 2 P1 parity (sprints 22–31)
- CRM list UX + communication log — sprints 32–33
- Jobs list pagination — sprint 34
- App shell: notification bell + profile menu + Help & FAQ link — shipped (see CHANGELOG)
- Settings → Business structured form (partial; sprint 35 completes parity)

## Scheduled — Phase 3 (35–36) ✅ done

See `tasks/sprint-35-company-profile-parity.md`, `tasks/sprint-36-onboarding-address-ux.md`.

## Scheduled — Phase 4 (37–42)

| Item | Sprint | Status |
|------|--------|--------|
| Reports date range + CSV export | 37 | ✅ |
| Customer detail tabs + tags UI | 38 | ✅ |
| Bookings inbox pagination, filters, bulk decline | 39 | ✅ |
| Manual booking: custom fields, payment section, review | 40 | ✅ |
| Calendar month view + conflict hints | 41 | ✅ |
| Portal reschedule + Book Again polish | 42 | ✅ |

## Scheduled — Phase 5 (43–44) — dashboard parity ✅

| Item | Sprint | Status |
|------|--------|--------|
| KPI ops queues + deep links + Create Booking CTA | 43 | ✅ |
| Today schedule enrichment + crew activity feed | 43 | ✅ |
| Payments/jobs list filters for KPI deep links | 43 | ✅ |
| 30-day business snapshot row (post Getting Started) | 44 | ✅ |
| Time-aware greeting + business name | 44 | ✅ |
| Shared reporting helper for dashboard teaser | 44 | ✅ |

Audit: `canvases/dashboard-vs-convertlabs.canvas.tsx`

## Owner action (not a sprint)

- Resend production domain verify — `tasks/launch-checklist.md` line 17
- Stripe Checkout Playwright E2E — env-gated (`tasks/sprint-12-operations-growth.md`)

## P2 — post Phase 4 (not scheduled)

- Service-area zip lists / radius enforcement
- Branding colors on booking page
- Editable `publicSlug`
- Provider Open Jobs self-claim pool
- Providers Activity kanban board
- Promo codes / gift cards on portal rebook
- iCal sync / Zapier official connector
- Multi-location
- Native iOS/Android apps
- Website builder, marketing campaigns, quotes/invoices pipeline
- Provider payouts / wage reporting
- Sales tax engine
- Per-template email copy editing
- Full notification center (mark-read, in-app prefs)

## Out of scope (intentional — do not schedule)

- **AI business name suggestions** — ConvertLabs feature; omitted per `docs/adr/0005-mvp-scope-boundaries.md`

## Ideas

- Reminder scheduling UI (custom intervals beyond 24h/2h cron)
- PWA install prompt on `/crew`
- Customer referral program (CL portal tab)
