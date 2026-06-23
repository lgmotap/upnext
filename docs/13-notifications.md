# Notifications

## Channels
MVP: email only. Later: SMS, push, WhatsApp.

## MVP Email Templates
| Template | Recipient | Trigger |
|---|---|---|
| booking-confirmation | Customer | Booking request submitted |
| new-booking-request | Owner/admin | Booking request submitted |
| booking-accepted | Customer | Request accepted |
| booking-declined | Customer | Request declined |
| booking-reminder | Customer | Before scheduled job |
| crew-job-assigned | Team member | Job assigned |
| job-completed | Customer | Job marked complete |
| payment-request | Customer | Owner sends payment request |

## Rules
No duplicate reminders; record all attempts; org-timezone scheduling; include business contact details; never expose internal notes to customers.

## Reminder Timing (default)
24 hours before, 2 hours before. Business can toggle later.
