# Sprint 48 — Providers Activity kanban board

> **Status:** 📋 Planning (not started)  
> **Phase:** 6 (P2 post-parity)  
> **Backlog:** `tasks/backlog.md`  
> **Audit:** `tasks/competitor-parity-audit-plan.md` — Providers Activity board  
> **Depends on:** Job lifecycle + crew status (OTW/late/check-in) from core MVP

---

## Current state

| Surface | UpNext today |
|---------|--------------|
| CL “Providers Activity” | Kanban-style board of provider job states |
| UpNext scheduler | Day board with worker columns + unassigned sidebar (sprint 31) |
| Dashboard | Today schedule list + activity feed (sprint 43) |
| Crew status | `checkedInAt`, OTW/late via `NotificationLog` |

**Gap:** No real-time **per-worker column kanban** across statuses (e.g. En route · On site · Done).

## Planning goals

1. Map CL columns to UpNext job statuses + crew events
2. **Live vs refresh** — polling interval vs SSE (prefer polling v1)
3. Relationship to `/app/calendar/scheduler` — replace, tab, or separate route?
4. Mobile viewport — usable on dispatcher phone?

## Scope (TBD)

### Data

- [ ] `getProvidersActivityBoard(orgId, date)` — workers × job chips by status bucket
- [ ] Status buckets: unassigned · scheduled · in_progress · completed (today)

### UI

- [ ] `/app/team/activity` or calendar sub-tab “Activity”
- [ ] Horizontal kanban: one column per active worker + unassigned
- [ ] Job card: customer, time, address snippet, status badge
- [ ] Click → job detail

### Polish

- [ ] Highlight late jobs / no check-in past start
- [ ] Filter by date (default today)

### Tests & docs

- [ ] `scripts/smoke-providers-activity.ts`
- [ ] Browser checklist row in `docs/audits/browser-checklists.md`

## Out of scope

- Drag-drop status changes (crew actions stay on `/crew`)
- Payroll / hours aggregation
- Historical activity beyond selected day

## Validation

- [ ] TBD smoke
- [ ] `npm run build` — new route compiles

## Open questions (PO)

1. Separate nav item vs tab under Calendar?
2. Include workers with zero jobs today?
3. Show customer PII on board or initials only?
