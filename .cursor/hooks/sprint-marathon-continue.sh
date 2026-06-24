#!/usr/bin/env bash
# Auto-resume UpNext sprint marathon when agent turn ends but MVP tasks remain.
set -euo pipefail

ROOT="${CURSOR_PROJECT_DIR:-$(pwd)}"
cd "$ROOT" 2>/dev/null || true

FILES=(
  "tasks/sprint-07-dashboard-settings.md"
  "tasks/sprint-08-beta-hardening.md"
  "tasks/launch-checklist.md"
)

has_unchecked=false
for f in "${FILES[@]}"; do
  if [[ -f "$f" ]] && grep -qE '^- \[ \]' "$f"; then
    has_unchecked=true
    break
  fi
done

if [[ "$has_unchecked" == "true" ]]; then
  cat <<'EOF'
{
  "followup_message": "Continue UpNext sprint marathon per .cursor/rules/090-autonomous-sprint-execution.mdc and upnext-sprint-marathon skill. Read tasks/mvp-traceability.md and HANDOFF.md, find the first unchecked - [ ] item in the current sprint (07 → 08 → launch-checklist), implement via upnext-feature-loop, run smoke tests, mark [x], update HANDOFF.md. Do not ask to continue. Do not commit unless asked. Stop only on documented blockers."
}
EOF
else
  echo '{}'
fi

exit 0
