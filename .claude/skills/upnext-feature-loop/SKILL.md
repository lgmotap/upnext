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
6. Fix until green or document a real blocker (missing OAuth, etc.).
7. Self-review the diff for correctness + security (tenant isolation, RBAC).
8. Update docs / add ADR if architecture changed.
9. Summarize what changed, commands run, and pass/fail results.
10. If invoked under **sprint marathon** (`upnext-sprint-marathon`) and unchecked items remain in sprint 07, 08, or `launch-checklist.md`, **do not end the session** — proceed to the next unchecked task immediately.
