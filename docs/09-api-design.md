# API Design

Prefer **server actions** for authenticated dashboard mutations; use **API routes** for webhooks, public endpoints, and cron. Validate all input with Zod; typed responses; safe error messages; log internal errors server-side.

## Standard Error Shape
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Please check the form and try again.", "fields": {} } }
```

## Server Actions
- **Business**: createBusinessProfile, updateBusinessProfile, updateBusinessSettings
- **Services**: createService, updateService, archiveService, reorderServices
- **Availability**: updateWeeklyAvailability, createBlackoutDate, deleteBlackoutDate
- **Bookings**: createPublicBookingRequest, acceptBookingRequest, declineBookingRequest, rescheduleBookingRequest
- **Jobs**: createJob, updateJob, assignJob, updateJobStatus, completeJobChecklistItem, uploadJobPhoto, completeJob
- **Customers**: createCustomer, updateCustomer, addCustomerAddress, updateCustomerAddress
- **Team**: inviteTeamMember, updateTeamMemberRole, deactivateTeamMember
- **Payments**: createPaymentRecord, sendPaymentLink, markPaymentPaid, markPaymentOverdue

## API Routes
- `POST /api/webhooks/stripe` — verify signature, parse event, update payment/subscription, idempotent, logged.
- `POST /api/cron/reminders` — find upcoming jobs, send reminders per settings, no duplicates.
