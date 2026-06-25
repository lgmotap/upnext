# Sprint 47 — Provider Open Jobs self-claim pool

> **Status:** 📋 Planning (not started)  
> **Phase:** 6 (P2 post-parity)  
> **Backlog:** `tasks/backlog.md`  
> **Audit:** `tasks/competitor-parity-status.md` § Field / crew — “Open Jobs self-claim”  
> **Depends on:** Sprint 31 scheduler (unassigned jobs sidebar), sprint 05 crew RBAC

---

## Current state

| Capability | UpNext today |
|------------|--------------|
| Unassigned jobs | `/app/calendar/scheduler` sidebar + dashboard “Needs assignment” KPI |
| Assignment | Owner/dispatcher drag-drop or job detail assign |
| Crew `/crew` | **Assigned jobs only** — workers cannot browse open pool |
| CL reference | “Open Jobs” tab — provider self-claim |

## Planning goals

1. Define **open job** — unassigned + scheduled? pending booking accepted but unassigned?
2. **Claim flow** — worker taps claim → auto `JobAssignment` or approval queue?
3. **Conflicts** — worker availability + double-booking on claim
4. **Notifications** — notify dispatcher when job claimed?
5. **Permissions** — all workers vs designated “floaters” only

## Scope (TBD)

### Crew UI

- [ ] `/crew/open` or tab on `/crew` — list claimable jobs (date, address, service, pay hint)
- [ ] Claim action with optimistic lock (first claim wins)

### Server

- [ ] `claimOpenJobAction` — worker role, assigned job only after claim, tenant scoped
- [ ] Repository query: unassigned jobs in date window visible to org workers
- [ ] Conflict check: worker availability + scheduling policy

### Owner settings (optional v1)

- [ ] Toggle `openJobsSelfClaimEnabled` on org or business profile
- [ ] Max jobs per worker per day cap?

### Tests & docs

- [ ] `scripts/smoke-open-jobs.ts`
- [ ] Update crew docs / parity status

## Out of scope

- Bidding / pay negotiation on open jobs
- GPS proximity sort (route optimization)
- Push notifications (SMS/email mirror optional)

## Validation

- [ ] TBD smoke
- [ ] RBAC: worker cannot claim job outside org; cannot access `/app/*`

## Open questions (PO)

1. Auto-assign on claim vs dispatcher approval?
2. Show pay/price to worker before claim?
3. How far ahead can workers see open jobs (today only vs week)?
