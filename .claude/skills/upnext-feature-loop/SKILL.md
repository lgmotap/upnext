---
name: upnext-feature-loop
description: Build an UpNext product feature with the read→plan→implement→validate→review loop.
---
# UpNext Feature Loop
1. Read relevant `docs/` and `tasks/`.
2. Inspect existing code and patterns.
3. Write a short plan (files, data model, validators, permissions, tests).
4. Implement the smallest safe version.
5. **Run tests yourself** — `npm run smoke:e2e` / `npm run smoke:booking` / `scripts/ai/validate.sh` as applicable. Do not hand off untested work.
6. **Run `npm run build`** after sprint/UI work; every new/changed route must compile. Client components must not import Prisma, `pg`, or server-only modules.
7. Fix until green or document a real blocker (missing OAuth, etc.).
8. Self-review the diff for correctness + security (tenant isolation, RBAC).
9. Update docs / add ADR if architecture changed.
10. Summarize what changed, commands run, and pass/fail results.
11. If invoked under **sprint marathon** (`upnext-sprint-marathon`) and unchecked items remain in sprint 07, 08, or `launch-checklist.md`, **do not end the session** — proceed to the next unchecked task immediately and just postpone the specific check item of the ones that need human interaction to do the task.
