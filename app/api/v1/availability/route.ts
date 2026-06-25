import { NextResponse } from "next/server";
import { parseSinceCursor, requireApiKey } from "@/lib/api/auth";
import { apiData, apiError, parseApiDateYmd, parseCsvIds, parsePositiveInt } from "@/lib/api/response";
import { getOrgAvailableDays, getOrgSlotsForDay } from "@/server/services/bookings";

export async function GET(request: Request) {
  const auth = await requireApiKey(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get("serviceId")?.trim();
  const date = parseApiDateYmd(searchParams.get("date"));
  const durationMinutes = parsePositiveInt(searchParams.get("durationMinutes"));
  const addonIds = parseCsvIds(searchParams.get("addonIds"));

  if (!serviceId) {
    return apiError("MISSING_SERVICE_ID", "serviceId is required", 400);
  }

  if (!date) {
    return apiError("INVALID_DATE", "date must be YYYY-MM-DD", 400);
  }

  const slotResult = await getOrgSlotsForDay(
    auth.organizationId,
    serviceId,
    date,
    addonIds,
    undefined,
    durationMinutes ? { durationMinutesOverride: durationMinutes } : undefined,
  );

  if (!slotResult) {
    return apiError("NOT_FOUND", "Service not found or unavailable", 404);
  }

  const daysResult = await getOrgAvailableDays(auth.organizationId, serviceId, addonIds);

  return apiData(
    slotResult.slots.map((s) => ({
      date: s.date,
      time: s.time,
      startAt: s.startAt.toISOString(),
      endAt: s.endAt.toISOString(),
    })),
    {
      meta: {
        date,
        serviceId,
        timeZone: slotResult.timeZone,
        durationMinutes: durationMinutes ?? null,
        bookableDates: daysResult?.days.map((d) => d.date) ?? [],
      },
    },
  );
}
