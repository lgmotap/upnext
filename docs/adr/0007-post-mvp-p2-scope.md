# ADR 0007: Post-MVP P2 scope (Phase 6)

**Status:** Accepted (planning)  
**Date:** 2026-06-25  
**Context:** Phases 3–5 (sprints 35–44) complete. Launch gate is Resend prod domain only. P2 backlog items need explicit scope boundaries separate from ADR 0005 MVP deferrals.

## Decision

Schedule **Phase 6** work as individual sprints (45+) without expanding core MVP scope docs. The following are **approved for planning and build** when prioritized:

| Sprint | Feature | Notes |
|--------|---------|-------|
| 45 | Service-area zip / radius enforcement | Optional per org; default off |
| 46 | Multi-location | Requires ADR review + `Location` entity before implementation |
| 47 | Provider Open Jobs self-claim | Crew-facing; dispatcher assign remains |
| 48 | Providers Activity kanban | Dispatcher ops board |
| 49 | Promo codes (portal + public book) | Gift cards deferred unless PO promotes to 49 |

**Still deferred (no sprint without new ADR):** website builder, marketing automation, native apps, payouts/wage reporting, quotes/invoices pipeline, route optimization, AI features.

## Relationship to ADR 0005

ADR 0005 remains the MVP boundary document. Phase 6 features are **post-validation expansions** for operators who need ConvertLabs-adjacent depth after core loop is live. They do not change MVP success criteria in `docs/02-mvp-scope.md`.

## Service-area enforcement (sprint 45)

- Does not require multi-location.
- US ZIP allowlist works without Google Maps; radius mode may require server geocode env.
- Public booking hard-block; manual booking allows privileged override.

## Multi-location (sprint 46)

- Explicitly excluded from MVP in ADR 0005; sprint 46 planning must produce an entity design and migration strategy before code.
- Sprint 45 org-wide enforcement can ship first; sprint 46 may add per-location overrides.

## Promo / gift cards (sprint 49)

- MVP excluded both; sprint 49 may ship **promo codes only** first.
- Gift cards imply stored-value liability and portal UX — separate ADR amendment if added.

## Why

Operators asked for geo enforcement and crew/dispatch depth after parity sprints. Tracking them as numbered sprints prevents ad-hoc scope creep while keeping MVP docs stable.

## Consequences

- `tasks/full-product-roadmap.md` gains Phase 6 section.
- `tasks/mvp-traceability.md` references Phase 6 for post-MVP work only.
- Agents must not implement sprint 46+ before PO locks open questions in each sprint file.
