---
name: upnext-product-review
description: Review changes for product correctness, MVP scope, security, and tests.
---
# UpNext Product Review
Check the diff against `docs/`:
- Product behavior matches requirements (`docs/01`).
- Stays within MVP scope (`docs/02`).
- Security: tenant isolation + RBAC (`docs/10`), validated/rate-limited public input.
- Payments follow `docs/12` (webhooks source of truth, idempotent).
- Tests added/updated for business logic.
Report findings by severity with file:line and a recommended fix.
