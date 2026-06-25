# Sprint 42 — Portal reschedule + Book Again polish

> Post sprint 26 portal gaps vs CL customer portal.  
> Audit: `docs/audits/product-gaps-roadmap.md` § Customer portal

---

## Plan (read before implementing)

### Problem

Customers must contact the business to reschedule — FAQ says “contact us”. ConvertLabs portal allows in-app reschedule within policy. Cancel + Book Again exists but lacks CL’s “cleaning plan” context sidebar.

### Product decisions

- **Reschedule policy** mirrors cancel: `minNoticeHours` from portal settings — same validator path as `cancelFromPortalAction`
- **Slot picker** reuses public booking slot loading (`server/actions/manual-booking-slots.ts` or `availability` service) scoped to customer’s service/address
- **No new payment step** on reschedule — price unchanged unless service duration changes (out of scope)
- **Book Again sidebar** is read-only summary: last service, frequency, address — not a new booking flow

### Technical approach

1. `rescheduleFromPortalAction` in `server/actions/customer-portal.ts`
   - Verify portal session + job/booking ownership
   - Validate notice window
   - Update `Job.scheduledStartAt` / `BookingRequest.requestedStartAt`
   - Notify owner + customer via existing notification service
2. `PortalRescheduleModal` client component on dashboard history tab
3. `CleaningPlanSidebar` on Book Again tab — data from last completed/upcoming booking in `getPortalDashboardData`
4. Update FAQ strings that say “contact us to reschedule”

### Risks

| Risk | Mitigation |
|------|------------|
| Slot conflicts after customer self-reschedule | Run `detectScheduleConflicts` server-side; return error with alternate slots |
| Recurring series edge case | Reschedule single occurrence only; document series behavior in FAQ |

### Dependencies

- Sprint 26 portal auth — password/magic link sessions
- Scheduling depth (22) — buffers respected in slot API

### Success

Customer reschedules upcoming job inside policy without calling; Book Again tab shows last plan context before redirect.

---

## Current state

- Magic link + optional password (sprint 26)
- Tabs: history, book again, payments
- Cancel upcoming — policy-bound (`minNoticeHours`)
- FAQ accordion on Book Again; no in-portal reschedule
- `docs/15-customer-portal.md`

## Scope

### Portal reschedule

- [x] On upcoming booking/job row: **Reschedule** when within policy (same rules as cancel notice)
- [x] Modal: pick new date/slot (reuse slot-loading pattern from public booking or server action)
- [x] `rescheduleFromPortalAction` — customer session + ownership check
- [x] Email confirmation on reschedule

### Book Again polish

- [x] “Cleaning plan” sidebar — show last service + frequency + address summary on Book Again tab (lite CL parity)
- [x] Prefill query params unchanged; improve visible context before redirect to `/book/[slug]`

### Docs

- [x] Update `docs/15-customer-portal.md` and `lib/portal/faq.ts` if reschedule replaces “contact us to reschedule” copy

## Out of scope

- Referral program tab
- Gift cards / promo on rebook
- Portal payment method management changes (sprint 16 done)

## Validation

- [x] `npm run smoke:customer-portal`
- [x] `npm run smoke:portal-faq`
- [x] New or extended `smoke:portal-reschedule` script
- [x] `npm run typecheck` + `npm run build`
