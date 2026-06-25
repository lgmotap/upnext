# Sprint 30 — Custom booking fields (lite forms builder)

> CL: Settings → Forms · public booking “Additional Information” beyond a single notes box.

## Schema

- [x] `BookingFormField` — `organizationId`, `key`, `label`, `fieldType` (text | textarea | select | checkbox), `optionsJson`, `required`, `sortOrder`, `active`
- [x] `BookingRequest.customFieldsJson` — `{ [key]: value }` on submit

## Owner UI

- [x] `/app/settings/booking-form` — CRUD fields (max 10 per org)
- [x] Preview snippet showing field order on public form
- [x] Do not build full drag-drop form designer — list reorder via up/down

## Public + manual booking

- [x] Render dynamic fields after frequency / before confirm (or replace static `customerNotes` if fields exist)
- [x] Zod validation per field type on server
- [x] Booking detail + job detail display custom field answers

## API (optional)

- [x] `GET /api/v1/custom-fields` if sprint 27 pattern established

## Validation

- [x] `npm run smoke:custom-booking-fields` — create field → public book → value on booking detail
- [x] `npm run test:e2e` — no regression on default orgs without custom fields
