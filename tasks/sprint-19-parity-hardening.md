# Sprint 19 — Parity hardening & full E2E

> Complete `tasks/competitor-parity-audit-plan.md` Parts 1–13 + release quality.

## Code quality

- [x] Fix lint errors (RescheduleModal setState-in-effect, etc.)
- [x] `npm run build` green

## Parity audit execution

- [x] Part 1 — Public booking browser checklist documented (`docs/audits/browser-checklists.md`)
- [x] Part 2 — Owner ops browser checklist
- [x] Part 3 — Services & availability
- [x] Part 4 — Crew workflow
- [x] Part 5 — Payments & reports
- [x] Part 6 — Customer portal
- [x] Part 7 — CRM
- [x] Part 8 — RBAC
- [x] Part 9 — Notifications
- [x] Part 10 — Onboarding
- [x] Part 11 — Settings
- [x] Part 13 — Positioning doc `docs/audits/competitor-positioning.md`
- [x] Update `tasks/competitor-parity-status.md` final scorecard

## Playwright full flow

- [x] `tests/e2e/full-product-flow.spec.ts` — signup → onboard → public book → accept → crew → pay (env-gated Stripe)
- [x] `npm run test:e2e:full` script

## Validation

- [x] `npm run smoke:launch` + all sprint smokes 14–18
