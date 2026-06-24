import { NextResponse } from "next/server";
import { processJobReminders } from "@/server/services/notifications";

/**
 * Job reminder cron — 24h and 2h before scheduled start.
 * Protect with CRON_SECRET header. See docs/13-notifications.md.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: { code: "NOT_CONFIGURED", message: "CRON_SECRET is not set." } },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }

  const result = await processJobReminders();
  return NextResponse.json({ ok: true, ...result });
}
