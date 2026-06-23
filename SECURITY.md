# Security Policy

UpNext handles business and customer data for home-service companies. Security is a first-class concern.

## Core Rules
- **Deny by default.** Every organization-owned resource is authorized server-side.
- **Tenant isolation.** Every query filters by the authenticated user's organization membership. Never trust an `organizationId` from the client.
- **Workers** can only access jobs assigned to them.
- **Validate all external input** with Zod at every boundary (server actions, API routes, public booking).
- **Rate-limit** public booking and customer-facing endpoints.
- **Stripe**: verify webhook signatures; webhook events are the source of truth; processing is idempotent; never store raw card data.
- **Secrets** never reach the client. Use server-only env vars.
- Do not log personal data unnecessarily.

## Reporting a Vulnerability
Email security@upnext.app. Do not open a public issue for security reports.
