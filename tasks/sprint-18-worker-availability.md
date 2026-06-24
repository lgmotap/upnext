# Sprint 18 — Per-worker availability

> CL: Provider Availability tab. UpNext uses org-level only today.

## Schema

- [x] `MembershipAvailabilityRule` — membershipId, dayOfWeek, startHm, endHm (or reuse pattern from org rules)

## Slot engine

- [x] When job has assignment, optional filter: only slots where assigned worker is available
- [x] Public booking: org-level unchanged (MVP)
- [x] Manual booking assign: warn if worker unavailable at slot

## UI

- [x] `/app/team/[membershipId]` or modal — edit worker weekly hours
- [x] Crew member sees read-only hours on `/crew`

## Validation

- [x] `npm run smoke:worker-availability`
