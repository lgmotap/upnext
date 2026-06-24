# Sprint 18 — Per-worker availability

> CL: Provider Availability tab. UpNext uses org-level only today.

## Schema

- [ ] `MembershipAvailabilityRule` — membershipId, dayOfWeek, startHm, endHm (or reuse pattern from org rules)

## Slot engine

- [ ] When job has assignment, optional filter: only slots where assigned worker is available
- [ ] Public booking: org-level unchanged (MVP)
- [ ] Manual booking assign: warn if worker unavailable at slot

## UI

- [ ] `/app/team/[membershipId]` or modal — edit worker weekly hours
- [ ] Crew member sees read-only hours on `/crew`

## Validation

- [ ] `npm run smoke:worker-availability`
