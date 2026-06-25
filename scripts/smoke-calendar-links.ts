import { buildCalendarLinks } from "../lib/datetime/calendar-links";

const start = new Date("2026-06-25T18:00:00.000Z");
const end = new Date("2026-06-25T19:30:00.000Z");

const links = buildCalendarLinks({
  uid: "booking-smoke-1",
  title: "House cleaning — Sparkle Co",
  description: "Booking request with Sparkle Co. Reference: booking-smoke-1",
  location: "123 Main St, Austin, TX 78701",
  startAt: start,
  endAt: end,
});

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

console.log("▶ Calendar links smoke\n");

assert(links.googleUrl.includes("calendar.google.com"), "Google URL host");
assert(links.googleUrl.includes("House+cleaning"), "Google URL title");
assert(links.googleUrl.includes("20260625T180000Z%2F20260625T193000Z"), "Google URL dates");

assert(links.outlookUrl.includes("outlook.live.com"), "Outlook URL host");
assert(links.outlookUrl.includes("subject=House"), "Outlook URL subject");
assert(links.outlookUrl.includes("startdt=2026-06-25T18%3A00%3A00Z"), "Outlook URL start");

assert(links.ics.includes("BEGIN:VCALENDAR"), "ICS header");
assert(links.ics.includes("SUMMARY:House cleaning"), "ICS title");
assert(links.icsDataUrl.startsWith("data:text/calendar"), "ICS data URL");

console.log("✓ Google, Outlook, and ICS links built");
console.log("\n✓ Calendar links smoke passed");
