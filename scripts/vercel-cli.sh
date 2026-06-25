#!/usr/bin/env bash
# Use the project-local Vercel CLI (devDependency) — avoids npx download prompts on every run.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERCEL="$ROOT/node_modules/.bin/vercel"
if [[ ! -x "$VERCEL" ]]; then
  echo "error: Vercel CLI not found. Run: npm install" >&2
  exit 1
fi
exec "$VERCEL" "$@"
