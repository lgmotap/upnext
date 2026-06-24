# Sprint 19 — Parity hardening & full E2E

> Complete `tasks/competitor-parity-audit-plan.md` Parts 1–13 + release quality.

## Parity audit execution

- [ ] Part 1 — Public booking browser checklist documented
- [ ] Part 2 — Owner ops browser checklist
- [ ] Part 3 — Services & availability
- [ ] Part 4 — Crew workflow
- [ ] Part 5 — Payments & reports
- [ ] Part 6 — Customer portal
- [ ] Part 7 — CRM
- [ ] Part 8 — RBAC
- [ ] Part 9 — Notifications
- [ ] Part 10 — Onboarding
- [ ] Part 11 — Settings
- [ ] Part 13 — Positioning doc `docs/audits/competitor-positioning.md`
- [ ] Update `tasks/competitor-parity-status.md` final scorecard

## Playwright full flow

- [ ] `tests/e2e/full-product-flow.spec.ts` — signup → onboard → public book → accept → crew → pay (env-gated Stripe)
- [ ] `npm run test:e2e:full` script

## Code quality

- [ ] Fix lint errors (RescheduleModal setState-in-effect, etc.)
- [ ] `npm run build` green

## Validation

- [ ] `npm run smoke:launch` + all sprint smokes 14–18
