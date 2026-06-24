import { NextResponse } from "next/server";
import { retryPendingWebhookDeliveries } from "@/server/services/webhooks";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const retried = await retryPendingWebhookDeliveries();
  return NextResponse.json({ ok: true, retried });
}
