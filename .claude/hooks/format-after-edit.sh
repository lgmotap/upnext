#!/usr/bin/env bash
# Format edited files after a Write/Edit. Safe no-op if prettier isn't available.
set -euo pipefail
if command -v npx >/dev/null 2>&1; then
  npx --no-install prettier --write --ignore-unknown . >/dev/null 2>&1 || true
fi
exit 0
