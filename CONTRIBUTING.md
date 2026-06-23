# Contributing to UpNext

## Principles
- Modular monolith. No microservices, no premature abstractions.
- Business logic lives in `server/services`; DB access in `server/repositories`; input validation in `server/validators`; authorization in `server/permissions`.
- UI components stay dumb — no business logic in components.
- TypeScript everywhere. Money in integer cents. Timestamps in UTC.

## Workflow
1. Read the relevant files in `docs/` before changing product behavior.
2. Make the smallest safe change; follow existing patterns.
3. Run `scripts/ai/validate.sh` (typecheck + lint + test) before marking work done.
4. Add/update tests for changed business logic.
5. Update docs when behavior changes; add an ADR in `docs/adr/` for architectural decisions.

## Commits
- Small, reviewable commits with clear messages.
