#!/usr/bin/env bash
# Run Next.js dev with env vars injected from Vercel (no local secrets file).
set -euo pipefail
ENV="${VERCEL_ENV_TARGET:-development}"
exec npx vercel@latest env run --environment="$ENV" -- next dev
