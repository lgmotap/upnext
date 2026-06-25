# UpNext vs ConvertLabs — positioning

**Updated:** 2026-06-25 (Phase 3 sprints 35–36 planned)

## Who we serve

Home-service businesses (solo → ~50 staff): cleaning, lawn, handyman, etc. Same ICP as ConvertLabs.

## Where UpNext wins (wedges)

| Area | UpNext | ConvertLabs |
|------|--------|-------------|
| **Time to first book** | Industry catalog + icons at sign-up | Manual Service Studio setup |
| **Crew web** | Checklists, photos, check-in timer on `/crew` | Heavier native-app reliance |
| **Stack / cost** | Modern Next.js + Supabase + Stripe Connect | WordPress + legacy portal surface |
| **Operator UX** | Focused MVP routes, ⌘K search | 10-tab wizards, broad module sprawl |

## Where ConvertLabs is ahead (accepted gaps)

| Area | Notes | UpNext stance |
|------|--------|---------------|
| Drag-drop scheduler | Dispatch board | Shipped sprint 31; week calendar still available |
| Dashboard ops + analytics | CL home widgets | **Done (sprints 43–44)** — queue KPIs, today enrichment, 30d snapshot |
| Company profile / onboarding polish | `/company` + Places + logo | Shipped **35–36** |
| Pay at booking | Stripe on public form | **Optional toggle** (off by default) — sprint 24 |
| Quotes / invoices | Full AR module | Out of MVP scope |
| Website builder | WordPress hub | Out of scope |
| Public API | Partner integrations | Shipped sprint 20 + 27 expansion |
| Custom booking domain | DNS + WP | **Optional** — verified host routing (sprint 25) |

## Parity achieved (core loop)

Public book → inbox → job → assign → crew complete → payment → reports. Recurring series, bed/bath pricing, customer portal (magic link), CSV import, per-worker availability (sprint 18).

## Messaging for sales / landing

- **“Book in minutes, not days”** — pre-built cleaning catalog and availability.
- **“Your crew, on any phone”** — no app store; checklist + photos in the browser.
- **“Payments without the paperwork”** — Stripe Connect + one-click payment links.

## Evidence

- Scorecard: `tasks/competitor-parity-status.md`
- Profile gaps: `docs/audits/business-profile-gaps.md`
- Browser checks: `docs/audits/browser-checklists.md`
- Research baseline: `competitor-research/targets/convertlabs/reports/gap-analysis.md` (2026-06-24, partial stale)
