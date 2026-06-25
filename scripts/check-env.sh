#!/usr/bin/env bash
# Check backend env using Vercel-injected secrets (not .env.local placeholders).
set -euo pipefail
ENV="${VERCEL_ENV_TARGET:-development}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$SCRIPT_DIR/vercel-cli.sh" env run --environment="$ENV" -- tsx scripts/check-env.ts
