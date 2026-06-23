# Product Requirements Document

UpNext gives each home-service business a dashboard, public booking page, service setup, scheduling, customer CRM, team management, payment tracking, and mobile job execution.

## Primary Product Areas
Auth & onboarding · Business profile/settings · Services & pricing · Availability · Public booking page · Booking request management · Jobs & calendar · Customers & addresses · Team & assignments · Mobile crew view · Payments & invoices · Notifications · Dashboard & reports.

## Core Requirements (acceptance criteria summarized)
- **R1 Business Account** — sign up/in; create one organization; become owner; business has name, slug, timezone, currency, contact, service area, logo; slug unique.
- **R2 Services** — name, description, duration, price, active/public flags, optional category; historical job details preserved when a service changes.
- **R3 Availability** — weekly hours, blackout dates, minimum notice, max future window; booking page only shows valid slots.
- **R4 Public Booking** — at `/book/[businessSlug]`; select service/date/time + contact/address/notes; validated; creates pending request; notifies owner and customer.
- **R5 Booking Management** — view/accept/decline/reschedule requests; accept converts to a job; status history recorded.
- **R6 Jobs** — customer, address, service, schedule, status, price, notes; statuses scheduled/confirmed/in_progress/completed/cancelled/no_show; assignable; checklist + photos; completable.
- **R7 Calendar** — day/week views, filter by team member, conflict warnings, open jobs.
- **R8 Customers** — profile (name, email, phone, notes, tags), multiple addresses, job/payment history, basic duplicate detection.
- **R9 Team** — invite/add members (name, email, phone, role, active); assign to jobs; enforce role permissions.
- **R10 Crew View** — today's assigned jobs; card with time/address/notes/checklist; mark in progress; complete checklist; upload photos; mark complete.
- **R11 Payments** — status not_requested/pending/paid/overdue/failed/refunded; manual marking; Stripe payment link/invoice; reflected on dashboard and views; webhook updates.
- **R12 Notifications** — booking received/accepted/declined/reminder, job assigned, job completed, payment request emails.
- **R13 Dashboard** — today's jobs, pending requests, new bookings this week, revenue, outstanding unpaid, recent activity.

## Out of Scope (MVP)
Website builder, native apps, marketing/SMS campaigns, promo codes, gift cards, auto card holds, auto-charge, payouts, multi-location.
