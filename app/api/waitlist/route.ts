import { NextResponse } from "next/server";
import { rateLimitKeyFromHeaders } from "@/lib/rate-limit";
import { submitWaitlistLead, WaitlistRateLimitError } from "@/server/services/waitlist";
import { waitlistLeadSchema } from "@/server/validators/waitlist";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = waitlistLeadSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Please check the form and try again.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const rateLimitKey = rateLimitKeyFromHeaders(req.headers);

  try {
    await submitWaitlistLead(parsed.data, rateLimitKey);
  } catch (err) {
    if (err instanceof WaitlistRateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    const detail = err instanceof Error ? err.message : String(err);
    const code =
      err && typeof err === "object" && "code" in err ? String((err as { code: string }).code) : "";
    console.error("[waitlist] submit failed:", code, detail, err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
