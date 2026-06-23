#!/usr/bin/env bash
# Reminder hook: encourage validation before finishing.
set -euo pipefail
echo '{"systemMessage":"Reminder: run scripts/ai/validate.sh (typecheck + lint + test) before considering the task complete."}'
exit 0
