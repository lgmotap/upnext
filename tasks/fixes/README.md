# Sprint fixes — product polish & parity gaps

**Purpose:** Small, user-reported or audit-discovered gaps that do not belong in Phase 6 P2 (sprints 45–49) or SEO track. Each fix sprint is scoped, shippable, and tied to competitor research or PRD acceptance criteria.

**When to use:** UX bugs, missing settings links, incomplete CRUD vs documented parity, settings layout inconsistencies.

**Not here:** New modules (quotes, payouts), Phase 6 features (open jobs kanban), marketing SEO (`tasks/seogeo/`).

---

## Sprint order

| Sprint | File | Theme | Status |
|--------|------|-------|--------|
| **FIX-01** | [sprint-fix-01-team-crew-settings.md](./sprint-fix-01-team-crew-settings.md) | Service Providers parity: create + crew login link + route guards + settings UI | 📋 Approved — implement |

---

## Validation (every fix sprint)

```bash
npm run typecheck
npm run lint
npm run build
# + sprint-specific smokes listed in each file
```

---

## Traceability

- PRD R9 (Team): `docs/01-product-requirements.md`
- CL Service Providers: `competitor-research/RESEARCH-PLAN.md` Phase 8
- Parity scorecard: `tasks/competitor-parity-status.md` §4 CRM, team, settings
- Prior audit: conversation report 2026-06-26 (crew link, team profile, settings UI)
