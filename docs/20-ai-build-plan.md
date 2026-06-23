# AI Build Plan

Loop for each feature:
1. Read relevant `docs/`.
2. Inspect existing code.
3. Short plan.
4. Implement smallest safe version.
5. Run `scripts/ai/validate.sh`.
6. Fix errors; repeat until green or a real blocker.
7. Self-review the diff.
8. Update docs / add ADR if architecture changed.
9. Summarize changes + how to test.

Cursor rules live in `.cursor/rules/`; Claude commands/skills/hooks in `.claude/`. Sprints and backlog in `tasks/`.
