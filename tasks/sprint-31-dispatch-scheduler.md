# Sprint 31 — Dispatch scheduler (drag-drop)

> CL: Calendar → **Scheduler** tab — dispatch board; largest P1 item.  
> **Prerequisite:** sprints 22 (buffers) + 18 (worker availability) should be done first.

## Scope (MVP of scheduler)

- [x] `/app/calendar/scheduler` — day + week views with time grid
- [x] Job chips draggable to new time slot + worker column (multi-worker orgs)
- [x] Drop triggers reschedule with conflict check (buffer + worker hours + org availability)
- [x] Optimistic UI + server action `rescheduleJobFromSchedulerAction`
- [x] Unassigned jobs sidebar column (pending accepted jobs without assignment)

## Out of scope (this sprint)

- Month view, route optimization, auto-assign AI, recurring series drag (single occurrence only)

## Tech

- [x] Use existing calendar data fetch; avoid new Prisma patterns
- [x] Consider `@dnd-kit/core` or native HTML5 DnD — justify in PR if adding dependency
- [x] Mobile: read-only week list fallback (no drag on small screens)

## Validation

- [x] `npm run smoke:scheduler` — drag job to new slot, verify DB `scheduledStartAt`
- [x] `npm run smoke:worker-availability` — drop on unavailable worker fails with message
- [x] Playwright: scheduler smoke (optional in `test:e2e:full` env gate)
