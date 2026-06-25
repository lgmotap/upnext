# Sprint 28 — Crew & field polish

> CL: `provider-job-workflow.md` — embedded map in drawer; same-day Running Late may include ETA.

## Embedded map

- [x] `/crew/jobs/[id]` — static Google Maps embed iframe from job address (no API key if using embed query; or Maps Static API env-gated)
- [x] Fallback: external “Open in Maps” link when embed blocked
- [x] Respect CSP / Next.js config for iframe src

## Running late ETA (same-day)

- [x] When job `scheduledStartAt` is today: Running Late opens minutes-late selector (15 / 30 / 45 / custom)
- [x] Customer email includes ETA text
- [x] Future-dated jobs keep yes/no warning only (CL behavior)

## Minor parity

- [x] Job detail shows full addon list as dash-separated line (CL drawer format)
- [x] Completed jobs: optional “hide from list after 24h” filter on `/crew` (defer if noisy)

## Validation

- [x] Manual browser check on `/crew/jobs/[id]` map render
- [x] `npm run smoke:scheduling` — late notification with ETA field
- [x] `npm run smoke:launch-crew` green
