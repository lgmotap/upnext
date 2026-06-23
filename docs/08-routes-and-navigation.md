# Routes and Navigation

> In this repo the authenticated product is namespaced under `/app/*` so the marketing site can keep `/`. Public booking, crew, and auth stay top-level.

## Auth
```
/sign-in
/sign-up
/forgot-password
```

## Product (App)
```
/app/onboarding          (post-signup business setup wizard)
/app/dashboard
/app/bookings
/app/bookings/[bookingRequestId]
/app/calendar
/app/jobs
/app/jobs/[jobId]
/app/customers
/app/customers/[customerId]
/app/team
/app/services
/app/payments
/app/settings/business
/app/settings/availability
/app/settings/notifications
/app/settings/billing
```

## Public
```
/book/[businessSlug]
/book/[businessSlug]/confirmation/[bookingRequestId]
```

## Crew
```
/crew
/crew/today
/crew/jobs/[jobId]
```

## API
```
/api/webhooks/stripe
/api/cron/reminders
```

## Sidebar (MVP)
Dashboard · Bookings · Calendar · Jobs · Customers · Team · Services · Payments · Settings.
Later: Customer Portal · Website · Marketing · Automations · Integrations · Reports.
