---
name: upnext-feature-loop
description: Build an UpNext product feature with the read→plan→implement→validate→review loop.
---
# UpNext Feature Loop
1. Read relevant `docs/` and `tasks/`.
2. Inspect existing code and patterns.
3. Write a short plan (files, data model, validators, permissions, tests).
4. Implement the smallest safe version.
5. Run `scripts/ai/validate.sh`; fix until green or a real blocker.
6. Self-review the diff for correctness + security (tenant isolation, RBAC).
7. Update docs / add ADR if architecture changed.
8. Summarize what changed and exact steps to test.
