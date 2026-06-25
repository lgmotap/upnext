#!/usr/bin/env bash
# Check Resend production gate using Vercel-injected secrets.
set -euo pipefail
ENV="${VERCEL_ENV_TARGET:-production}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$SCRIPT_DIR/vercel-cli.sh" env run --environment="$ENV" -- tsx scripts/check-resend-production.ts
