#!/usr/bin/env bash
# Block obviously destructive shell commands before they run.
set -euo pipefail
input="$(cat)"
if printf '%s' "$input" | grep -Eiq 'rm[[:space:]]+-rf[[:space:]]+/|drop[[:space:]]+database|prisma[[:space:]]+migrate[[:space:]]+reset|git[[:space:]]+push[[:space:]]+--force'; then
  echo '{"decision":"block","reason":"Blocked a potentially destructive command. Run it manually if intended."}'
fi
exit 0
