# Sprint 06 — Payments, Notifications, Crew Depth

> Traceability: `tasks/mvp-traceability.md` — checklists + photos promoted from sprint 05 (MVP scope).

## Payments
- [x] `PaymentRecord` model + migration (status: pending, paid, overdue, refunded)
- [x] Stripe Connect onboarding (Settings → business/billing) — UI wired; E2E verified in dev
- [x] Stripe Checkout payment link on job
- [x] Stripe webhook (signature-verified, idempotent)
- [x] Payment status badge on `/app/jobs` + job detail
- [x] Manual mark paid / overdue (owner action)
- [x] Wire `/app/payments` list to real PaymentRecords (replace mock)

## Wire booking detail (still on mock — see traceability audit)
- [x] `/app/bookings/[bookingRequestId]` — load from Prisma, not `lib/mock/data`
- [x] Accept / decline actions on detail page (same as list)
- [x] Link to job when accepted; customer contact + estimate sidebar

## Email notifications (Resend + NotificationLog)
- [x] `NotificationLog` model (type, recipient, status, job/booking ref)
- [x] Booking request received (customer) — wired + log
- [x] **New booking request (owner)** — alert on public submit
- [x] Booking accepted (customer) — on accept action
- [x] Job assigned (worker) — on assignment
- [x] Job reminder cron (24h before scheduled start)
- [x] **2h same-day reminder (customer)**
- [x] **Job completed summary (customer)**
- [x] **Payment link / request (customer)**

## Crew depth (MVP scope — was incorrectly deferred)
- [x] Check-in timer: `Job.checkedInAt`, elapsed display on `/crew/jobs/[id]`
- [x] Service checklist template (org-level default items per service)
- [x] Checklist completion on crew job page
- [x] Photo upload (1–5 images per job, Supabase Storage)
- [x] Display uploaded photos on owner job detail

## Team (unblocks crew in production)
- [x] Minimal team invite flow (email invite → worker role → `/crew` access)
