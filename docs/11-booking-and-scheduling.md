# Booking and Scheduling

## Booking Type (MVP)
Request-based: customers request a time; the business confirms or changes it. Instant booking comes later.

## Booking Request Statuses
pending · accepted · declined · cancelled · expired.

## Job Statuses
scheduled · confirmed · in_progress · completed · cancelled · no_show.

## Availability Rules (MVP)
Weekly business hours · blackout dates · minimum notice · maximum future window · service duration · basic conflict warnings.
Later: per-member availability, travel buffers, route areas, instant booking, recurring discounts, calendar sync.

## Scheduling Rules
UTC storage, org-timezone display; job end = start + duration unless edited; prevent impossible times publicly; warn on conflicts but allow admin override in MVP.

## Calendar Views
MVP: today, week, filter by member. Later: month, drag-and-drop, route map, availability grid.
