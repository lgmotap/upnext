import { NextResponse } from "next/server";
import { processDueJobSeries } from "@/server/services/recurring-jobs";

/**
 * Generate scheduled jobs for active recurring series.
 * Protect with CRON_SECRET. Schedule daily via vercel.json.
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

  const result = await processDueJobSeries();
  return NextResponse.json({ ok: true, ...result });
}
