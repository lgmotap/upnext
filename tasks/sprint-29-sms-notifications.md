# Sprint 29 — SMS notifications

> CL: marketing claims SMS on Professional+; help center not fully crawled — treat as P1 parity for reminders + OTW/late.

## Provider & schema

- [x] Evaluate **Twilio** vs Resend SMS (if available on account) — document choice in `docs/architecture/notifications.md`
- [x] `BusinessProfile.smsEnabled` + `smsFromNumber` (or Twilio messaging service SID)
- [x] `Customer.phone` required check before SMS send; skip silently if missing

## Settings UI

- [x] `/app/settings/notifications` — per-audience SMS toggles mirror email (customer: confirm, reminder, OTW/late; worker: assign)
- [x] Owner-only; show “connect SMS” setup when credentials missing

## Send paths

- [x] Mirror existing email triggers in `server/services/notifications.ts` — SMS branch when toggle on
- [x] `NotificationLog` — `channel: email | sms`
- [x] Rate limit + cost guard (max SMS per org per day configurable env)

## Validation

- [x] `npm run smoke:sms` — mock Twilio client in test; skip live send without `TWILIO_*` env
- [x] Email-only orgs unchanged — all smokes green
