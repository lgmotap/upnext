import { NextResponse } from "next/server";

/**
 * Reminder cron endpoint — STUB.
 * Implemented in Sprint 06 (docs/13-notifications.md):
 * find upcoming jobs, send reminders per settings, avoid duplicates. Protect with CRON_SECRET.
 */
export async function POST() {
  return NextResponse.json(
    { error: { code: "NOT_IMPLEMENTED", message: "Reminder cron is not wired up yet." } },
    { status: 501 },
  );
}
