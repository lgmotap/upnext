# Browser verification checklists

Executable parity audit for ConvertLabs comparison. Use org slug **`smoke-test-co`** when a seeded org is required.

**Living status:** `tasks/competitor-parity-status.md`  
**Full plan:** `tasks/competitor-parity-audit-plan.md`

---

## Part 1 — Public booking (`/book/[slug]`)

| # | Check | Smoke / evidence |
|---|--------|------------------|
| 1 | Service selection updates price + duration | Manual |
| 2 | Add-on toggles update total | Manual |
| 3 | Bed/bath pricing params (when configured) | `npm run smoke:pricing-params` |
| 4 | Frequency step (one-time / weekly / bi-weekly / monthly) | Manual |
| 5 | Calendar distinguishes bookable vs unavailable days | `npm run smoke:booking` |
| 6 | Slot list loads after date pick | `npm run smoke:e2e` |
| 7 | Validation errors surface (`?error=` banner) | Manual |
| 8 | Confirmation: ICS, portal link, frequency | Manual |
| 9 | Embed route minimal chrome | `npm run test:e2e` (embed test) |

---

## Part 2 — Owner booking ops

| # | Check | Smoke / evidence |
|---|--------|------------------|
| 1 | Accept pending → job created | `npm run smoke:e2e` |
| 2 | Decline with confirm modal | Manual |
| 3 | Reschedule pending booking | `npm run smoke:scheduling` |
| 4 | Reschedule job (conflict-aware) | `npm run smoke:scheduling` |
| 5 | Manual booking end-to-end | `npm run smoke:manual-booking` |
| 6 | Worker assign filters slots | `npm run smoke:worker-availability` |
| 7 | Calendar week nav + job links | Manual |
| 8 | ⌘K global search | `npm run smoke:global-search` |

---

## Part 3 — Services & availability

| # | Check | Smoke / evidence |
|---|--------|------------------|
| 1 | Create / edit / archive service | Manual |
| 2 | Addon linked to primary | Manual |
| 3 | Checklist template per service | `npm run smoke:checklist` |
| 4 | Org availability affects public slots | `npm run smoke:booking` |
| 5 | Industry catalog on new org | `npm run smoke:industry-catalog` |
| 6 | Per-worker hours | `npm run smoke:worker-availability` |

---

## Part 4 — Crew workflow (`/crew`)

| # | Check | Smoke / evidence |
|---|--------|------------------|
| 1 | Worker cannot access `/app/*` | `npm run test:e2e` |
| 2 | Only assigned jobs visible | `npm run smoke:launch-crew` |
| 3 | Check-in timer | Manual |
| 4 | Checklist persists | `npm run smoke:checklist` |
| 5 | Job photos 1–5 | `npm run smoke:job-photos` |
| 6 | OTW / Running Late | Manual |
| 7 | Read-only working hours | Manual (`/crew`) |

---

## Part 5 — Payments & reports

| # | Check | Smoke / evidence |
|---|--------|------------------|
| 1 | Stripe Connect settings | Manual `/app/settings/billing` |
| 2 | Send payment link | `npm run smoke:launch-payment` |
| 3 | Webhook idempotency | `npm run smoke:stripe` |
| 4 | Manual mark paid | Manual |
| 5 | Reports revenue | `npm run smoke:reports` |

---

## Part 6 — Customer portal (`/my/[slug]`)

| # | Check | Smoke / evidence |
|---|--------|------------------|
| 1 | Portal toggle respected | `npm run smoke:portal-links` |
| 2 | Magic link session | `npm run smoke:customer-portal` |
| 3 | Book again prefilled | `npm run smoke:customer-portal` |
| 4 | Cancel within policy | `npm run smoke:portal-cancel` |
| 5 | Saved Stripe card | `npm run smoke:portal-saved-card` |

---

## Part 7 — CRM

| # | Check | Smoke / evidence |
|---|--------|------------------|
| 1 | Customer list + detail | Manual |
| 2 | Notes + addresses | Manual |
| 3 | CSV import | `npm run smoke:customer-import` |

---

## Part 8 — RBAC

| # | Check | Role |
|---|--------|------|
| 1 | Owner full access | owner |
| 2 | Worker `/crew` only | worker |
| 3 | Viewer read-only | viewer |
| 4 | Cross-org denied | any |

Evidence: `server/permissions/can.ts` + manual spot checks.

---

## Part 9 — Notifications

| # | Check | Smoke / evidence |
|---|--------|------------------|
| 1 | Booking confirmation email | Resend sandbox |
| 2 | Reminder cron | `app/api/cron/reminders` |
| 3 | Toggle honors `BusinessProfile` | Manual settings |

---

## Part 10 — Onboarding

| # | Check | Smoke / evidence |
|---|--------|------------------|
| 1 | Sign-up → wizard → dashboard | `npm run smoke:launch-onboarding` |
| 2 | Default catalog seeded | `npm run smoke:industry-catalog` |

---

## Part 11 — Settings

| # | Route | Check |
|---|--------|--------|
| 1 | `/app/settings/business` | Sectioned profile; logo/website in sprint 35 |
| 2 | `/app/settings/availability` | Weekly rules + blackouts |
| 3 | `/app/settings/billing` | Stripe Connect |
| 4 | `/app/settings/portals` | Customer portal toggle |

---

## Running the full automated suite

```bash
npm run smoke:launch          # core launch path
npm run smoke:worker-availability
npm run smoke:customer-import
npm run smoke:pricing-params
npm run test:e2e
npm run test:e2e:full         # extended route coverage
```
