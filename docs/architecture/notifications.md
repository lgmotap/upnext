# Notifications architecture

UpNext sends customer and worker notifications over **email** (Resend) and optional **SMS** (Twilio).

## Email (Resend)

- Templates and send paths live in `server/services/notifications.ts`.
- Every send is logged in `NotificationLog` with `channel: email`.
- Owner toggles on `/app/settings/notifications` (email section).
- Production requires a verified sending domain — see `docs/13-notifications.md`.

## SMS (Twilio)

**Provider choice:** Twilio (not Resend SMS). Resend is email-only on the UpNext account; Twilio is the standard programmatic SMS API with per-message billing, E.164 validation, and a simple REST API without adding a second email vendor dependency.

### Configuration

| Env var | Purpose |
|---------|---------|
| `TWILIO_ACCOUNT_SID` | Twilio account |
| `TWILIO_AUTH_TOKEN` | API auth |
| `TWILIO_FROM_NUMBER` | Default E.164 sender |
| `SMS_MAX_PER_ORG_PER_DAY` | Optional daily cap per org (default 100) |

Per-org overrides: `BusinessProfile.smsEnabled`, `smsFromNumber`, and SMS toggles on `/app/settings/notifications`.

### Send behavior

- `lib/sms/twilio.ts` — send + mock when env missing (logs to console, no live send).
- `server/services/sms-notifications.ts` — `sendAndLogSms`, rate limit, `NotificationLog` with `channel: sms`.
- SMS mirrors selected email triggers: 24h reminder, on-the-way, running late (worker assign SMS toggle reserved for future).
- Customers without `phone` are skipped silently.

### Security

- Twilio credentials are server-only env vars.
- SMS bodies are plain text; no PII beyond name/time already in email templates.
