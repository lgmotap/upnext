/**
 * Site-wide configuration.
 *
 * Everything launch-phase-dependent lives here. When the product launches,
 * change `phase` to "launch" and update the CTA strings — every button,
 * link, and form on the page reads from this file.
 */

export const site = {
  name: "UpNext",
  tagline: "Run your service business from one simple dashboard",
  description:
    "A simple platform for service businesses to manage bookings, customers, jobs, teams, payments, and follow-ups from one place.",
  url: "https://upnext.example.com",
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
    "Built for cleaning, lawn care, handyman, painting, pet care, car wash, and other local service teams.",
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
    "You're on the list. We'll contact you before public launch with early access details.",
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

export const currentTools = [
  "Spreadsheet",
  "Paper / notebook",
  "Google Calendar",
  "WhatsApp / messages",
  "Existing software",
  "A mix of tools",
  "Other",
] as const;
