# Data Model

Money in integer **cents**; timestamps in **UTC**; display in org timezone. Every business-owned entity carries `organizationId` (directly or via strict relation) and is filtered by membership server-side.

## Entities (fields)
- **User**: id, email, name, avatarUrl, createdAt, updatedAt
- **Organization**: id, name, slug, ownerId, timezone, currency, status, timestamps
- **Membership**: id, organizationId, userId, role(owner|admin|dispatcher|worker|viewer), status(active|invited|disabled), timestamps
- **TeamInvite**: id, organizationId, email, role, token, invitedById, expiresAt, acceptedAt, createdAt
- **BusinessProfile**: id, organizationId, displayName, publicSlug, logoUrl, phone, email, websiteUrl, serviceArea, serviceAreaEnforcementMode(off|zip_list|radius), serviceAreaRadiusMiles, serviceAreaZipCodesJson, addressLatitude, addressLongitude, description, bookingEnabled, timestamps
- **Location**: id, organizationId, name, isDefault, isActive, address fields, phone, optional timezone, sortOrder — service branches; default backfilled from BusinessProfile
- **Service**: id, organizationId, categoryId, name, description, durationMinutes, basePriceCents, currency, isActive, isPublic, sortOrder, timestamps
- **AvailabilityRule**: id, organizationId, dayOfWeek, startTime, endTime, isActive
- **BlackoutDate**: id, organizationId, startsAt, endsAt, reason
- **Customer**: id, organizationId, firstName, lastName, email, phone, notes, tags, timestamps
- **CustomerAddress**: id, customerId, line1, line2, city, region, postalCode, country, notes, isDefault
- **BookingRequest**: id, organizationId, locationId, customerId, serviceId, requestedStartAt, requestedEndAt, status(pending|accepted|declined|cancelled|expired), customerNotes, internalNotes, source, timestamps
- **Job**: id, organizationId, locationId, bookingRequestId, customerId, customerAddressId, serviceId, title, scheduledStartAt, scheduledEndAt, status(scheduled|confirmed|in_progress|completed|cancelled|no_show), priceCents, currency, customerNotes, internalNotes, completionNotes, checkedInAt, completedAt, timestamps
- **JobAssignment**: id, jobId, membershipId, role, assignedAt
- **ChecklistTemplate**: id, organizationId, serviceId, label, sortOrder, isActive, timestamps
- **JobChecklistItem**: id, jobId, label, isCompleted, completedByMembershipId, completedAt, sortOrder
- **JobPhoto**: id, jobId, uploadedByMembershipId, storagePath, mimeType, type(before|after|proof|issue|other), caption, createdAt
- **PaymentRecord**: id, organizationId, jobId, customerId, amountCents, currency, status(not_requested|pending|paid|overdue|failed|refunded), provider(manual|stripe), stripePaymentIntentId, stripeCheckoutSessionId, paymentUrl, paidAt, dueAt, timestamps
- **NotificationLog**: id, organizationId, recipientType, recipientEmail, channel(email|sms|push), template, status, relatedType, relatedId, sentAt, error
- **ActivityLog**: id, organizationId, actorUserId, actorType, action, entityType, entityId, metadata, createdAt
- **Subscription**: id, organizationId, stripeCustomerId, stripeSubscriptionId, plan, status, currentPeriodEnd, timestamps

## Safety Rules
Use migrations; no destructive migration without confirmation; index common lookups; integer cents; UTC timestamps; store org timezone for display.
