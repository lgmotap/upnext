/**
 * Mock data for the UpNext product UI shell.
 *
 * This stands in for the real data layer (server/repositories) until the
 * backend sprints land. Shapes loosely mirror docs/07-data-model.md so screens
 * can be swapped onto real data with minimal churn. Money is in integer cents.
 */

export type JobStatus =
  | "scheduled"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export type BookingStatus = "pending" | "accepted" | "declined" | "cancelled" | "expired";

export type PaymentStatus =
  | "not_requested"
  | "pending"
  | "paid"
  | "overdue"
  | "failed"
  | "refunded";

export type Role = "owner" | "admin" | "dispatcher" | "worker" | "viewer";

export const business = {
  name: "Sparkle & Shine Cleaning Co.",
  slug: "sparkle-shine",
  timezone: "America/New_York",
  currency: "USD",
  ownerName: "Alex Rivera",
  serviceArea: "Greater Austin, TX",
  email: "hello@sparkleshine.co",
  phone: "(512) 555-0142",
};

export const services = [
  { id: "svc_std", name: "Standard Clean", durationMinutes: 120, priceCents: 12000, isActive: true, isPublic: true, bookings: 38 },
  { id: "svc_deep", name: "Deep Clean", durationMinutes: 240, priceCents: 22000, isActive: true, isPublic: true, bookings: 21 },
  { id: "svc_move", name: "Move-out Clean", durationMinutes: 300, priceCents: 34000, isActive: true, isPublic: true, bookings: 12 },
  { id: "svc_office", name: "Office / Commercial", durationMinutes: 180, priceCents: 28000, isActive: true, isPublic: true, bookings: 9 },
  { id: "svc_carpet", name: "Carpet Add-on", durationMinutes: 60, priceCents: 6000, isActive: false, isPublic: false, bookings: 4 },
];

export const team = [
  { id: "mem_alex", name: "Alex Rivera", initials: "AR", role: "owner" as Role, email: "alex@sparkleshine.co", active: true, jobsThisWeek: 0 },
  { id: "mem_maya", name: "Maya Reyes", initials: "MR", role: "worker" as Role, email: "maya@sparkleshine.co", active: true, jobsThisWeek: 11 },
  { id: "mem_jordan", name: "Jordan Park", initials: "JP", role: "worker" as Role, email: "jordan@sparkleshine.co", active: true, jobsThisWeek: 9 },
  { id: "mem_sam", name: "Sam Lee", initials: "SL", role: "dispatcher" as Role, email: "sam@sparkleshine.co", active: true, jobsThisWeek: 0 },
  { id: "mem_dev", name: "Devon Cole", initials: "DC", role: "worker" as Role, email: "devon@sparkleshine.co", active: false, jobsThisWeek: 0 },
];

export const customers = [
  { id: "cus_harper", name: "Harper Residence", contact: "Nina Harper", email: "nina@example.com", phone: "(512) 555-0110", address: "812 Oak Ridge Dr, Austin, TX", jobs: 14, lifetimeCents: 168000, tags: ["recurring", "vip"] },
  { id: "cus_lakeside", name: "Lakeside Offices", contact: "Facilities Team", email: "ops@lakeside.com", phone: "(512) 555-0188", address: "200 Lakeshore Blvd, Austin, TX", jobs: 26, lifetimeCents: 728000, tags: ["commercial"] },
  { id: "cus_nguyen", name: "Nguyen Family", contact: "Linh Nguyen", email: "linh@example.com", phone: "(512) 555-0166", address: "44 Bluebonnet Ln, Austin, TX", jobs: 31, lifetimeCents: 372000, tags: ["recurring"] },
  { id: "cus_oak", name: "Oak St. Rental", contact: "Property Mgmt", email: "pm@oakrentals.com", phone: "(512) 555-0177", address: "9 Oak St #3, Austin, TX", jobs: 5, lifetimeCents: 170000, tags: ["move-out"] },
  { id: "cus_green", name: "Greenway LLC", contact: "Reception", email: "front@greenway.co", phone: "(512) 555-0199", address: "1500 Greenway Pkwy, Austin, TX", jobs: 8, lifetimeCents: 224000, tags: ["commercial"] },
];

export const bookingRequests = [
  { id: "bk_1", customer: "Sara Bennett", service: "Standard Clean", requestedAt: "Fri, Jun 19 · 2:00 PM", submitted: "12 min ago", address: "77 Cedar Ct, Austin, TX", notes: "Two cats, please use unscented products.", status: "pending" as BookingStatus },
  { id: "bk_2", customer: "Mr. Davis", service: "Carpet Add-on", requestedAt: "Sat, Jun 20 · 10:00 AM", submitted: "1 hr ago", address: "230 Pine Ave, Austin, TX", notes: "Living room + stairs.", status: "pending" as BookingStatus },
  { id: "bk_3", customer: "Priya Shah", service: "Deep Clean", requestedAt: "Mon, Jun 22 · 9:00 AM", submitted: "3 hrs ago", address: "5 Maple Row, Austin, TX", notes: "First-time deep clean before guests arrive.", status: "pending" as BookingStatus },
  { id: "bk_4", customer: "Tom Walters", service: "Standard Clean", requestedAt: "Tue, Jun 23 · 1:00 PM", submitted: "Yesterday", address: "18 Birch St, Austin, TX", notes: "", status: "accepted" as BookingStatus },
  { id: "bk_5", customer: "Olivia Crane", service: "Move-out Clean", requestedAt: "Wed, Jun 24 · 8:00 AM", submitted: "Yesterday", address: "640 Elm Dr, Austin, TX", notes: "Empty apartment, keys in lockbox.", status: "declined" as BookingStatus },
];

export const jobs = [
  { id: "job_1", customer: "Harper Residence", customerId: "cus_harper", service: "Deep Clean", assignee: "Maya Reyes", assigneeInitials: "MR", start: "8:30 AM", date: "Today", address: "812 Oak Ridge Dr", status: "in_progress" as JobStatus, priceCents: 22000, payment: "pending" as PaymentStatus },
  { id: "job_2", customer: "Lakeside Offices", customerId: "cus_lakeside", service: "Office / Commercial", assignee: "Sam Lee", assigneeInitials: "SL", start: "10:00 AM", date: "Today", address: "200 Lakeshore Blvd", status: "scheduled" as JobStatus, priceCents: 28000, payment: "not_requested" as PaymentStatus },
  { id: "job_3", customer: "Nguyen Family", customerId: "cus_nguyen", service: "Standard Clean", assignee: "Jordan Park", assigneeInitials: "JP", start: "1:30 PM", date: "Today", address: "44 Bluebonnet Ln", status: "confirmed" as JobStatus, priceCents: 12000, payment: "pending" as PaymentStatus },
  { id: "job_4", customer: "Oak St. Rental", customerId: "cus_oak", service: "Move-out Clean", assignee: "Maya Reyes", assigneeInitials: "MR", start: "3:00 PM", date: "Today", address: "9 Oak St #3", status: "completed" as JobStatus, priceCents: 34000, payment: "paid" as PaymentStatus },
  { id: "job_5", customer: "Greenway LLC", customerId: "cus_green", service: "Office / Commercial", assignee: "Sam Lee", assigneeInitials: "SL", start: "6:00 PM", date: "Today", address: "1500 Greenway Pkwy", status: "scheduled" as JobStatus, priceCents: 28000, payment: "not_requested" as PaymentStatus },
  { id: "job_6", customer: "Bennett Home", customerId: "cus_harper", service: "Standard Clean", assignee: "Jordan Park", assigneeInitials: "JP", start: "9:00 AM", date: "Tomorrow", address: "77 Cedar Ct", status: "confirmed" as JobStatus, priceCents: 12000, payment: "pending" as PaymentStatus },
];

export const payments = [
  { id: "pay_1", customer: "Oak St. Rental", job: "Move-out Clean", amountCents: 34000, status: "paid" as PaymentStatus, date: "Today", method: "Stripe" },
  { id: "pay_2", customer: "Harper Residence", job: "Deep Clean", amountCents: 22000, status: "pending" as PaymentStatus, date: "Due Jun 20", method: "Link sent" },
  { id: "pay_3", customer: "Nguyen Family", job: "Standard Clean", amountCents: 12000, status: "pending" as PaymentStatus, date: "Due Jun 21", method: "Link sent" },
  { id: "pay_4", customer: "Birch St. Condo", job: "Standard Clean", amountCents: 12000, status: "overdue" as PaymentStatus, date: "Due Jun 12", method: "Manual" },
  { id: "pay_5", customer: "Lakeside Offices", job: "Office / Commercial", amountCents: 28000, status: "not_requested" as PaymentStatus, date: "—", method: "—" },
];

export const dashboardStats = [
  { label: "Jobs today", value: "6", delta: "2 completed", trend: "up" as const },
  { label: "Pending requests", value: "3", delta: "+3 new", trend: "up" as const },
  { label: "Revenue this week", value: "$4,860", delta: "+18% vs last", trend: "up" as const },
  { label: "Outstanding", value: "$1,240", delta: "2 to chase", trend: "down" as const },
];

export const weekRevenue = [42, 58, 50, 70, 62, 84, 95];

export const activity = [
  { who: "Maya Reyes", what: "marked Harper Residence — Deep Clean in progress", when: "8 min ago" },
  { who: "System", what: "received a booking request from Sara Bennett", when: "12 min ago" },
  { who: "Oak St. Rental", what: "paid $340.00 via Stripe", when: "1 hr ago" },
  { who: "Sam Lee", what: "scheduled Greenway LLC for 6:00 PM", when: "2 hrs ago" },
  { who: "Jordan Park", what: "completed Nguyen Family — Standard Clean", when: "Yesterday" },
];

export const checklist = [
  { id: "c1", label: "Kitchen — counters & appliances", done: true },
  { id: "c2", label: "Bathrooms — full clean", done: true },
  { id: "c3", label: "Bedrooms — vacuum & dust", done: false },
  { id: "c4", label: "Windows — interior only", done: false },
];

export function formatMoney(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}
