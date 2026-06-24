# Post-beta roadmap (ConvertLabs parity)

**Created:** 2026-06-25  
**Context:** MVP sprints 00–08 + launch checklist are done except Resend domain (deferred). Competitor research (`competitor-research/targets/convertlabs/reports/`) shows gaps in **reliability**, **customer portal**, **public booking parity**, and **owner ops polish**.

**PO decision:** Promote Phase 2 items from `docs/05-feature-map.md` into sprints 09–12. Customer portal moves from “later” to **Sprint 10**.

---

## Current faults (user-reported + audit)

| Issue | Root cause | Sprint |
|-------|------------|--------|
| Booking link looks broken / copies `localhost` | `NEXT_PUBLIC_APP_URL` duplicated; no visible URL; no prod warning | **09** |
| Getting Started “Share booking link” never completes | `done: false` hardcoded | **09** |
| Customer portal not visible anywhere | Never built; excluded from MVP; no Settings → Portals | **09** tab + **10** build |
| Book Again goes to generic `/book/[slug]` not prefilled | No portal session / query prefill | **10** |
| Public booking missing frequency step | CL “How Often?” not implemented | **11** |
| Search / notifications disabled shells | Honest defer; need real ⌘K | **12** |
| Some modals/actions untested in browser | Smoke scripts pass DB layer only | **09** + **12** E2E |

---

## Sprint order (09 → 12)

```
Sprint 09  Portal reliability — booking link UX, Portals settings, component audit, smoke:portal
Sprint 10  Customer portal v1 — magic link, history, book again, owner enable toggle
Sprint 11  Public booking parity — frequency, prefill params, embed widget, confirmation polish
Sprint 12  Operations growth — recurring jobs, ⌘K search, pricing params (MVP wedge), Playwright full flow
```

**After 12:** Resend prod domain (`tasks/launch-checklist.md` line 17) when owner is ready.

**Status (2026-06-25):** Sprints **09–12 complete**. Launch smokes green (`npm run smoke:launch`). Only Resend domain remains for production email.

---

## Competitor → sprint mapping

| ConvertLabs module | Report | UpNext sprint |
|--------------------|--------|---------------|
| Settings → Portals (booking + customer URLs) | `customer-portal.md` | 09 + 10 |
| Customer portal 3-tab SPA | `customer-portal.md` | 10 |
| Public booking 10 sections + frequency | `public-booking-standalone.md` | 11 |
| Service Studio frequencies + parameters | `app-coverage.md` | 11 (freq) / 12 (params) |
| Getting Started checklist | `onboarding-wizard.md` | 09 (fix) — done in batch 2 |
| Global search ⌘K | `navigation-map.md` | 12 |
| Recurring jobs | Service Studio | 12 |
| On The Way / Running Late | `provider-job-workflow.md` | ✅ batch 3 |
| Reschedule | owner + portal | ✅ batch 3; portal cancel in 10 |

---

## Success criteria (beta-ready v2)

1. Owner can **see, copy, preview, and embed** the public booking link from Settings → Portals and Business.
2. Customer can open **magic-link portal**, see booking history, **Book Again** prefilled, cancel upcoming (policy-bound).
3. Public booking matches CL core steps: contact → address → service → extras → **frequency** → slot → confirm.
4. Full Playwright: sign-up → onboarding → catalog → book → accept → crew complete → pay.
5. No dead UI in owner app (every nav item and CTA reaches a working page or honest “coming in sprint N”).

---

## Files

| Sprint | Task file |
|--------|-----------|
| 09 | `tasks/sprint-09-portal-reliability.md` |
| 10 | `tasks/sprint-10-customer-portal.md` |
| 11 | `tasks/sprint-11-booking-parity.md` |
| 12 | `tasks/sprint-12-operations-growth.md` |

Traceability: update `tasks/mvp-traceability.md` after each sprint.
