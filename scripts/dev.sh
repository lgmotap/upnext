#!/usr/bin/env bash
# Run Next.js dev with env vars injected from Vercel (no local secrets file).
set -euo pipefail
ENV="${VERCEL_ENV_TARGET:-development}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${PORT:-3000}"

if lsof -ti ":$PORT" >/dev/null 2>&1; then
  echo "error: port $PORT is already in use — stop the other process first:" >&2
  lsof -i ":$PORT" >&2 || true
  echo "  kill \$(lsof -ti :$PORT)   # then npm run dev again" >&2
  exit 1
fi

exec "$SCRIPT_DIR/vercel-cli.sh" env run --environment="$ENV" -- next dev -p "$PORT"
