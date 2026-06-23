#!/usr/bin/env bash
set -euo pipefail
echo "▶ typecheck"; ./scripts/ai/typecheck.sh
echo "▶ lint";      ./scripts/ai/lint.sh
echo "▶ test";      ./scripts/ai/test.sh
echo "✓ validation complete"
