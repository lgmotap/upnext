/**
 * Site-wide configuration.
 *
 * Everything launch-phase-dependent lives here. When the product launches,
 * change `phase` to "launch" and update the CTA strings — every button,
 * link, and form on the page reads from this file.
 */

export const site = {
  name: "BookedFox",
  tagline: "The easiest way to get booked and run your service business",
  // Plain-language category sentence — reused in the hero, meta description,
  // and JSON-LD. This is the GEO anchor ("X is a Y that helps Z").
  description:
    "BookedFox is online booking and business software for home-service providers — solo or team — that helps you get booked online and manage jobs, customers, your team, and payments in one place. Built for cleaning, lawn care, handyman, painting, pressure washing, pet care, car wash, and roofing businesses.",
  url: "https://bookedfox.com",
} as const;

export type LaunchPhase = "waitlist" | "launch";

export const phase: LaunchPhase = "waitlist";

export const cta = {
  // Primary action — swap to "Start free" / "/signup" at launch.
  primary: {
    label: "Join the waitlist",
    href: "#waitlist",
  },
  // Compact variant used in the header / announcement bar.
  compact: {
    label: "Join waitlist",
    href: "#waitlist",
  },
  secondary: {
    label: "See what's coming",
    href: "#features",
  },
  supporting: "Early access spots will be limited.",
  microcopy:
    "Built for cleaning, lawn care, handyman, painting, pressure washing, pet care, car wash, and other home-service teams.",
} as const;

export const announcement = {
  badge: "Early access",
  message: "We're opening access to a small group before public launch.",
  linkLabel: "Get on the list",
  href: "#waitlist",
} as const;

export const nav = [
  { label: "Features", href: "#features" },
  { label: "Before & After", href: "#before-after" },
  { label: "Who it's for", href: "#who-its-for" },
  { label: "How it works", href: "#how-it-works" },
  { label: "FAQ", href: "#faq" },
] as const;

export const waitlistForm = {
  title: "Join the early access list",
  subtitle:
    "We're opening access to a small group of service business owners before the public launch. Join the waitlist to get early access, product updates, and exclusive launch offers.",
  submitLabel: "Join the waitlist",
  successMessage:
    "You're on the list. Check your inbox for a confirmation email — we'll contact you before public launch with early access details.",
  errorMessage: "Something went wrong. Please try again.",
} as const;

export const serviceTypes = [
  "Residential Cleaning",
  "Commercial Cleaning",
  "Carpet Cleaning",
  "Lawn Care",
  "Pressure Washing",
  "Roofing",
  "Handyman",
  "Painting",
  "Pet Walking",
  "Car Wash",
  "Other service business",
  "I'm still deciding",
] as const;

export const teamSizes = [
  "Just me",
  "2–5 people",
  "6–15 people",
  "16–50 people",
  "50+ people",
] as const;

/** FAQ — shared by the on-page FAQ section and the FAQPage JSON-LD. */
export const faqs = [
  {
    q: "What is BookedFox?",
    a: "BookedFox is online booking and business software for home-service providers — solo or team. It gives you a professional online booking page where customers can book you, plus everything to run the work behind it: scheduling, customers, your team, payments, and automated follow-ups, all in one place.",
  },
  {
    q: "Who is BookedFox for?",
    a: "Solo operators and small teams in home services who want a simpler way to get booked and manage jobs, customers, schedules, payments, and follow-ups — without juggling spreadsheets, texts, and missed calls.",
  },
  {
    q: "Is this only for cleaning companies?",
    a: "No. Cleaning is one of the main use cases, but BookedFox is built for lawn care, handyman services, painting, pressure washing, pet walking, car wash, roofing, and other home-service businesses.",
  },
  {
    q: "Can my customers book me online?",
    a: "Yes. BookedFox gives you a branded booking page where customers pick a service, date, and time and request a booking in under a minute — so you get booked even while you're on a job or asleep.",
  },
  {
    q: "Is the product available now?",
    a: "Not yet. We're currently accepting early-access requests before the public launch. Waitlist members get access first.",
  },
  {
    q: "What do early users get?",
    a: "Early users get first access before public launch, behind-the-scenes product updates, a direct line to shape what we build, and exclusive launch offers.",
  },
  {
    q: "Do I need a team to use it?",
    a: "No. BookedFox works whether it's just you or a whole crew. Start solo and add team members whenever you're ready.",
  },
  {
    q: "Will this replace my spreadsheet?",
    a: "Yes — that's the goal. BookedFox is designed to replace messy spreadsheets, scattered texts, and manual tracking with one organized workspace.",
  },
  {
    q: "Does joining the waitlist cost anything?",
    a: "No. Joining the waitlist is free and there's no commitment. We'll simply contact you before public launch with early-access details.",
  },
] as const;

export const currentTools = [
  "Spreadsheet",
  "Paper / notebook",
  "Google Calendar",
  "WhatsApp / messages",
  "Existing software",
  "A mix of tools",
  "Other",
] as const;
