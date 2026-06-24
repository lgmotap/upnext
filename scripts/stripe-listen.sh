#!/usr/bin/env bash
# Forward Stripe webhooks to local Next.js. Run in a separate terminal alongside `npm run dev:next`.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env.local ]]; then
  echo "Missing .env.local — add STRIPE_SECRET_KEY first." >&2
  exit 1
fi

# shellcheck disable=SC1091
set -a
source .env.local
set +a

if [[ -z "${STRIPE_SECRET_KEY:-}" ]]; then
  echo "STRIPE_SECRET_KEY is empty in .env.local" >&2
  exit 1
fi

APP_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"
FORWARD="${APP_URL}/api/webhooks/stripe"

echo "→ Forwarding Stripe webhooks to ${FORWARD}"
echo "→ Copy the whsec_... signing secret into STRIPE_WEBHOOK_SECRET in .env.local, then restart dev."
echo ""

exec stripe listen --api-key "$STRIPE_SECRET_KEY" --forward-to "$FORWARD"
