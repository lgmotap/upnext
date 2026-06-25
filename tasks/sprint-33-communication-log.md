# Sprint 33 — Communication log UI

> CL gap: communication history beyond send toggles. UpNext already logs in `NotificationLog`.

## Scope

- [x] `/app/communications` — paginated delivery log (email + SMS)
- [x] Filter by channel
- [x] Human-readable template labels
- [x] Link to related job/booking/customer when applicable
- [x] Link from Settings → Notifications (“View delivery log”)

## Out of scope

- Per-template copy editing
- Inbound SMS / two-way threads
- Resend failed message action

## Validation

- [x] `npm run smoke:crm-lists` (log count assertion)
- [x] `npm run typecheck` + `npm run build`
