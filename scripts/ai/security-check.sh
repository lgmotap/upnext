#!/usr/bin/env bash
set -euo pipefail
echo "Manual gate — review docs/10-auth-and-permissions.md and SECURITY.md."
echo "Checklist: tenant isolation · RBAC · public input validation · rate limits · Stripe signatures · no card data · no leaked secrets."
