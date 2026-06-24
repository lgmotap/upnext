---
name: upnext-sprint-marathon
description: Run MVP sprints 07→08 and launch checklist to completion without pausing for confirmation.
---
# UpNext Sprint Marathon

Orchestrates remaining MVP work. Pair with `.cursor/rules/090-autonomous-sprint-execution.mdc`.

## Kickoff prompt

```
Run the UpNext sprint marathon per .cursor/rules/090-autonomous-sprint-execution.mdc
and upnext-sprint-marathon skill. Start at the first unchecked item in sprint 07.
Do not ask to continue. Do not commit. Fix tests yourself. Stop only on documented
blockers (missing secrets, ambiguous product). Continue through sprint 08 and
launch-checklist until done or blocked.
```

## Start
1. Read `tasks/mvp-traceability.md` (PO-approved order).
2. Read `HANDOFF.md` for current resume point.
3. Find first sprint with unchecked `- [ ]` items:
   - `tasks/sprint-07-dashboard-settings.md`
   - `tasks/sprint-08-beta-hardening.md`
   - `tasks/launch-checklist.md`
4. For each unchecked item: run `upnext-feature-loop` steps 1–9.

## Sprint done when
- All `- [ ]` in that sprint file are `[x]`.
- Relevant smoke scripts pass (`npm run smoke:e2e`, domain-specific smokes).
- `HANDOFF.md` updated with "Sprint N — done".

## Then (same session, no user prompt)
Open the next sprint file and repeat until launch checklist core items are done or a **documented blocker** stops you.

## Current resume (2026-06-24)
- **PAUSED** — user disabled auto-continue hook. Resume manually via kickoff prompt.
- **Launch checklist** — 1 item left: Resend prod domain (`tasks/launch-checklist.md` line 17).

## Blocker format (only valid stop)
```
BLOCKER: <what>
RESUME: Read tasks/<file>.md → "<exact unchecked line>"
COMMANDS TRIED: <list>
```
