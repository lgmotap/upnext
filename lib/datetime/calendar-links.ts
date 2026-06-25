import type { CalendarEventDetails } from "@/lib/datetime/calendar-event";
import { formatGoogleCalendarDates, formatOutlookDateTime } from "@/lib/datetime/calendar-event";
import { buildBookingIcsEvent, icsDataUrl } from "@/lib/datetime/ics";

export type CalendarLinks = {
  ics: string;
  icsDataUrl: string;
  googleUrl: string;
  outlookUrl: string;
  downloadFilename: string;
};

export function buildCalendarLinks(details: CalendarEventDetails): CalendarLinks {
  const ics = buildBookingIcsEvent(details);

  const googleParams = new URLSearchParams({
    action: "TEMPLATE",
    text: details.title,
    dates: formatGoogleCalendarDates(details.startAt, details.endAt),
    details: details.description,
  });
  if (details.location) googleParams.set("location", details.location);

  const outlookParams = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: details.title,
    startdt: formatOutlookDateTime(details.startAt),
    enddt: formatOutlookDateTime(details.endAt),
    body: details.description,
  });
  if (details.location) outlookParams.set("location", details.location);

  return {
    ics,
    icsDataUrl: icsDataUrl(ics),
    googleUrl: `https://calendar.google.com/calendar/render?${googleParams.toString()}`,
    outlookUrl: `https://outlook.live.com/calendar/0/deeplink/compose?${outlookParams.toString()}`,
    downloadFilename: "booking.ics",
  };
}
