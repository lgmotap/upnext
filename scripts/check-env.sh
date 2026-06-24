#!/usr/bin/env bash
# Check backend env using Vercel-injected secrets (not .env.local placeholders).
set -euo pipefail
ENV="${VERCEL_ENV_TARGET:-development}"
exec npx vercel@latest env run --environment="$ENV" -- tsx scripts/check-env.ts
