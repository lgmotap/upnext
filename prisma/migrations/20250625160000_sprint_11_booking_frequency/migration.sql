-- Sprint 11: booking frequency on public booking requests

CREATE TYPE "BookingFrequency" AS ENUM ('one_time', 'weekly', 'biweekly', 'monthly');

ALTER TABLE "BookingRequest" ADD COLUMN IF NOT EXISTS "frequency" "BookingFrequency" NOT NULL DEFAULT 'one_time';
