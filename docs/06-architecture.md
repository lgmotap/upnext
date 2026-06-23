# Architecture

UpNext is a **modular monolith** on Next.js App Router. Keep it fast to build, modular, server-side for business logic, with auth/permissions close to data access and external providers for commodity features. No microservices, no premature abstractions.

## Modules
Auth · Business · Services · Availability · Booking · Jobs · Calendar · Customers · Team · Crew View · Payments · Notifications · Dashboard · Analytics.

## Folder Responsibilities
| Folder | Purpose |
|---|---|
| `app/` | Routes, pages, layouts, API routes |
| `components/` | UI components |
| `server/actions/` | Server actions called from UI |
| `server/services/` | Business logic |
| `server/repositories/` | Database access |
| `server/validators/` | Zod schemas / input validation |
| `server/permissions/` | RBAC and ownership checks |
| `lib/` | Shared infrastructure utilities |
| `emails/` | Email templates |
| `prisma/` | Schema and migrations |
| `tests/` | Unit, integration, e2e |

## Request Flow
`UI/API → validator → auth/session check → permission check → service → repository/db → side effects (notifications/billing) → typed response`

## Public Booking Flow
Customer visits `/book/[businessSlug]` → load public profile + active services → select service/date/time → server validates availability → booking request created → customer matched/created → notifications sent → owner sees request.

## Job Completion Flow
Crew opens crew view → server checks assignment permission → member updates checklist/photos/status → job marked complete → activity log → completion notification → payment stays pending unless paid.

## URL Layout (this repo)
Marketing landing stays at `/`. The product app lives under `/app/*`. Public booking at `/book/[slug]`, crew at `/crew`, auth at `/sign-in` etc.
