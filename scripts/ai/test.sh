#!/usr/bin/env bash
set -euo pipefail
# Wire to Vitest once installed.
if npx --no-install vitest --version >/dev/null 2>&1; then
  npx vitest run
else
  echo "(no test runner installed yet — skipping)"
fi
