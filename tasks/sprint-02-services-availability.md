# Sprint 02 — Services + Availability
- [x] Services CRUD (name, description, duration, price, active/public, sort)
- [x] Weekly availability rules
- [x] Blackout dates
- [x] Booking window settings (min notice, max future, slot interval)
- [x] Validators + permissions (`canManageServices`)
- [x] `/app/services` wired to Prisma
- [x] `/app/settings/availability` wired to Prisma
- [x] `/book/[businessSlug]` loads real `BusinessProfile` + public services
- [ ] Slot generation from availability (deferred to Sprint 03 booking requests)
