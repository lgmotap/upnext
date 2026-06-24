# Notifications

## Channels
MVP: email only. Later: SMS, push, WhatsApp.

## MVP Email Templates
| Template | Recipient | Trigger |
|---|---|---|
| booking-confirmation | Customer | Booking request submitted |
| new-booking-request | Owner/admin | Booking request submitted |
| booking-accepted | Customer | Request accepted |
| booking-declined | Customer | Request declined |
| booking-rescheduled | Customer | Owner reschedules pending request |
| booking-reminder | Customer | Before scheduled job |
| crew-job-assigned | Team member | Job assigned |
| job-completed | Customer | Job marked complete |
| job-rescheduled | Customer | Owner reschedules scheduled job |
| job-on-the-way | Customer | Crew taps On the way |
| job-running-late | Customer | Crew taps Running late |
| payment-request | Customer | Owner sends payment request |

## Rules
No duplicate reminders; record all attempts; org-timezone scheduling; include business contact details; never expose internal notes to customers.

## Org toggles (Settings → Notifications)

Six toggles on `BusinessProfile` control whether each email type is sent: owner new-booking alert, customer booking confirmation, 24h/2h reminders, job completed summary, and payment request. Defaults match MVP (2h reminder off). Senders check prefs before dispatch; disabled types are not sent (no log row).

## Dev without a verified domain

Use `EMAIL_FROM=UpNext <onboarding@resend.dev>` and `RESEND_SANDBOX_TO` (your Resend login email). UpNext redirects outbound mail to that inbox with `[Dev → intended@]` in the subject until a domain is verified on the **UpNext** Resend account (the account whose API key is in `RESEND_API_KEY` — use **upnext-stripe** / **upnext-resend** MCP, not other projects).

## Before production (required)

Do **not** launch to real customers until this is done. Sandbox mode only delivers to one inbox; customers will not receive booking or payment emails.

1. **Resend Dashboard** (UpNext account) → **Domains** → add and verify your sending domain (e.g. `yourdomain.com`).
2. **Vercel** (Preview + Production):
   - `EMAIL_FROM=UpNext <notifications@yourdomain.com>` (must use the verified domain)
   - Remove `RESEND_SANDBOX_TO` (or leave unset — production must not redirect mail)
   - Keep `RESEND_API_KEY` from the same UpNext Resend account
3. Send a test booking email to a non-owner address and confirm it arrives (no `[Dev → …]` prefix).
4. Check off **Launch checklist** → “Resend domain verified” (`tasks/launch-checklist.md`).

See also: `.env.example`, `HANDOFF.md`, `lib/resend/config.ts`.

## Reminder cron

- `CRON_SECRET` in env; `POST /api/cron/reminders` with `Authorization: Bearer $CRON_SECRET`
- Deployed: hourly via `vercel.json`

## Reminder Timing (default)
24 hours before, 2 hours before. Business can toggle later.
