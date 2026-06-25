/** Shared booking event fields for ICS and calendar deep links. */
export type CalendarEventDetails = {
  uid: string;
  title: string;
  description: string;
  location: string;
  startAt: Date;
  endAt: Date;
};

/** UTC stamp for Google Calendar `dates` param: `YYYYMMDDTHHMMSSZ`. */
export function formatGoogleCalendarDates(startAt: Date, endAt: Date): string {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return `${fmt(startAt)}/${fmt(endAt)}`;
}

/** ISO 8601 UTC for Outlook `startdt` / `enddt`. */
export function formatOutlookDateTime(d: Date): string {
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}
