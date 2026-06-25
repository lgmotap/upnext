#!/usr/bin/env bash
# Push Supabase secrets to Vercel (all environments). Run once after copying from Supabase dashboard.
#
# Usage (paste real values inline — not saved to disk):
#   SUPABASE_SERVICE_ROLE_KEY='eyJ...' \
#   DATABASE_URL='postgresql://...' \
#   DIRECT_URL='postgresql://...' \
#   ./scripts/push-env-to-vercel.sh
#
set -euo pipefail
cd "$(dirname "$0")/.."

for var in SUPABASE_SERVICE_ROLE_KEY DATABASE_URL DIRECT_URL; do
  if [[ -z "${!var:-}" ]]; then
    echo "Missing $var. Export it before running this script."
    exit 1
  fi
done

VERCEL="$(dirname "$0")/vercel-cli.sh"

add_var() {
  local name="$1" value="$2"
  for env in development preview production; do
    printf '%s' "$value" | $VERCEL env add "$name" "$env" --force --sensitive 2>/dev/null || \
      printf '%s' "$value" | $VERCEL env add "$name" "$env" --sensitive
  done
  echo "✓ $name → development, preview, production"
}

add_var SUPABASE_SERVICE_ROLE_KEY "$SUPABASE_SERVICE_ROLE_KEY"
add_var DATABASE_URL "$DATABASE_URL"
add_var DIRECT_URL "$DIRECT_URL"

echo ""
echo "Done. Verify with: npm run check:env:vercel"
