-- AlterEnum
ALTER TYPE "NotificationTemplate" ADD VALUE IF NOT EXISTS 'booking_rescheduled';
ALTER TYPE "NotificationTemplate" ADD VALUE IF NOT EXISTS 'job_rescheduled';
ALTER TYPE "NotificationTemplate" ADD VALUE IF NOT EXISTS 'job_on_the_way';
ALTER TYPE "NotificationTemplate" ADD VALUE IF NOT EXISTS 'job_running_late';
