import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

/**
 * Waitlist lead capture.
 *
 * Currently appends leads to data/waitlist.jsonl (one JSON object per line —
 * easy to export or import into a spreadsheet). To switch to Supabase,
 * Airtable, or any backend later, replace the `persist` function only.
 */

type Lead = {
  id: string;
  firstName: string;
  email: string;
  businessName: string;
  businessType: string;
  businessSize: string;
  currentTool: string;
  source: string;
  createdAt: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function persist(lead: Lead) {
  const dir = path.join(process.cwd(), "data");
  await mkdir(dir, { recursive: true });
  await appendFile(path.join(dir, "waitlist.jsonl"), JSON.stringify(lead) + "\n", "utf8");
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const firstName = String(body.firstName ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const businessName = String(body.businessName ?? "").trim();

  if (!firstName || !businessName || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please provide a first name, business name, and valid email." },
      { status: 400 },
    );
  }

  const lead: Lead = {
    id: randomUUID(),
    firstName,
    email,
    businessName,
    businessType: String(body.businessType ?? "").trim(),
    businessSize: String(body.businessSize ?? "").trim(),
    currentTool: String(body.currentTool ?? "").trim(),
    source: String(body.source ?? "/").trim(),
    createdAt: new Date().toISOString(),
  };

  try {
    await persist(lead);
  } catch (err) {
    console.error("Failed to persist waitlist lead:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
