# Testing Strategy

- **Unit (Vitest)** — services, validators, money/date utils, permission checks.
- **Integration** — server actions against a test database (repositories + services).
- **E2E (Playwright)** — critical flows: onboarding, public booking → accept → job, crew completion, payment status.

## Rules
Add/update tests with any business-logic change. Run `scripts/ai/validate.sh` before marking work complete. Test authorization paths (deny by default, tenant isolation, worker-assigned-only).
