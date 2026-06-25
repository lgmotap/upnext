-- Sprint 27: booking_canceled webhook event
ALTER TYPE "WebhookEventType" ADD VALUE IF NOT EXISTS 'booking_canceled';
