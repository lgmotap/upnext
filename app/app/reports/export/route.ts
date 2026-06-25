import { NextResponse } from "next/server";
import { buildReportsExportCsv } from "@/lib/reports/csv";
import { parseReportDateRange } from "@/lib/reports/range";
import { prisma } from "@/lib/db/prisma";
import { canManageBusiness } from "@/server/permissions/can";
import { getAppSession } from "@/server/permissions/session";
import { getReportingExportRows } from "@/server/services/reporting";

export async function GET(request: Request) {
  const session = await getAppSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canManageBusiness(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const org = await prisma.organization.findUnique({
    where: { id: session.organizationId },
    select: { timezone: true, currency: true },
  });
  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const timeZone = org.timezone ?? "America/New_York";
  const currency = org.currency ?? "USD";
  const { searchParams } = new URL(request.url);
  const parsed = parseReportDateRange(searchParams.get("from") ?? undefined, searchParams.get("to") ?? undefined, timeZone);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const rows = await getReportingExportRows(
    session.organizationId,
    parsed.range.start,
    parsed.range.end,
    timeZone,
    currency,
  );
  const csv = buildReportsExportCsv(rows);
  const filename = `upnext-report-${parsed.range.fromYmd}-${parsed.range.toYmd}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
