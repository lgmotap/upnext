#!/usr/bin/env bash
# Check Resend production gate using Vercel-injected secrets.
set -euo pipefail
ENV="${VERCEL_ENV_TARGET:-production}"
exec npx vercel@latest env run --environment="$ENV" -- tsx scripts/check-resend-production.ts
