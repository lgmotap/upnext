/** Minimal ICS file for "Add to calendar" on booking confirmation. */
export function buildBookingIcsEvent(params: {
  uid: string;
  title: string;
  description: string;
  location: string;
  startAt: Date;
  endAt: Date;
}): string {
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const escape = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/\n/g, "\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//UpNext//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escape(params.uid)}@upnext`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(params.startAt)}`,
    `DTEND:${fmt(params.endAt)}`,
    `SUMMARY:${escape(params.title)}`,
    `DESCRIPTION:${escape(params.description)}`,
    `LOCATION:${escape(params.location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function icsDataUrl(ics: string): string {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}
