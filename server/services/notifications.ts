import { prisma } from "@/lib/db/prisma";
import { formatDisplayDateTime } from "@/lib/datetime/timezone";
import { formatMoney } from "@/lib/money/format";
import { appBaseUrl } from "@/lib/stripe/client";
import { getResend } from "@/lib/resend/client";
import {
  emailFromAddress,
  isResendConfigured,
  resolveOutboundEmail,
} from "@/lib/resend/config";
import {
  createNotificationLog,
  wasNotificationSent,
} from "@/server/repositories/notifications";
import { getNotificationPreferences } from "@/server/repositories/notification-preferences";
import type {
  NotificationRecipientType,
  NotificationTemplate,
} from "@/generated/prisma/client";

async function sendAndLogEmail(params: {
  organizationId: string;
  to: string;
  recipientType: NotificationRecipientType;
  template: NotificationTemplate;
  relatedType: string;
  relatedId: string;
  subject: string;
  text: string;
}): Promise<void> {
  const resend = getResend();

  if (!isResendConfigured() || !resend) {
    await createNotificationLog({
      organizationId: params.organizationId,
      recipientType: params.recipientType,
      recipientEmail: params.to,
      template: params.template,
      status: "skipped",
      relatedType: params.relatedType,
      relatedId: params.relatedId,
      error: "RESEND_API_KEY not set",
    });
    console.info("[notifications] skipped", params.template, params.to);
    return;
  }

  try {
    const outbound = resolveOutboundEmail({
      to: params.to,
      subject: params.subject,
      text: params.text,
    });

    const result = await resend.emails.send({
      from: emailFromAddress(),
      to: outbound.to,
      subject: outbound.subject,
      text: outbound.text,
    });

    if (result.error) {
      await createNotificationLog({
        organizationId: params.organizationId,
        recipientType: params.recipientType,
        recipientEmail: outbound.intendedTo,
        template: params.template,
        status: "failed",
        relatedType: params.relatedType,
        relatedId: params.relatedId,
        error: result.error.message,
      });
      console.error("[notifications] failed", params.template, result.error.message);
      return;
    }

    await createNotificationLog({
      organizationId: params.organizationId,
      recipientType: params.recipientType,
      recipientEmail: outbound.intendedTo,
      template: params.template,
      status: "sent",
      relatedType: params.relatedType,
      relatedId: params.relatedId,
      resendEmailId: result.data?.id ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown send error";
    await createNotificationLog({
      organizationId: params.organizationId,
      recipientType: params.recipientType,
      recipientEmail: params.to,
      template: params.template,
      status: "failed",
      relatedType: params.relatedType,
      relatedId: params.relatedId,
      error: message,
    });
    console.error("[notifications] failed", params.template, message);
  }
}

async function getOrgNotifierEmails(organizationId: string): Promise<string[]> {
  const members = await prisma.membership.findMany({
    where: {
      organizationId,
      status: "active",
      role: { in: ["owner", "admin", "dispatcher"] },
    },
    include: { user: true },
  });
  return [...new Set(members.map((m) => m.user.email).filter(Boolean))];
}

async function getOrgDisplayContext(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: { businessProfile: true },
  });
  if (!org) return null;
  return {
    timeZone: org.timezone,
    businessName: org.businessProfile?.displayName ?? org.name,
    phone: org.businessProfile?.phone ?? null,
    email: org.businessProfile?.email ?? null,
  };
}

function contactFooter(phone: string | null, email: string | null): string {
  const lines: string[] = [];
  if (phone) lines.push(`Phone: ${phone}`);
  if (email) lines.push(`Email: ${email}`);
  return lines.length > 0 ? `\n\nContact:\n${lines.join("\n")}` : "";
}

export async function notifyBookingRequestReceived(params: {
  organizationId: string;
  bookingRequestId: string;
  customerEmail: string;
  customerName: string;
  serviceName: string;
  requestedStartAt: Date;
  timeZone: string;
  businessName: string;
}): Promise<void> {
  const when = formatDisplayDateTime(params.requestedStartAt, params.timeZone);
  const prefs = await getNotificationPreferences(params.organizationId);

  if (prefs?.notifyCustomerBookingConfirmation !== false) {
    await sendAndLogEmail({
      organizationId: params.organizationId,
      to: params.customerEmail,
      recipientType: "customer",
      template: "booking_confirmation",
      relatedType: "booking_request",
      relatedId: params.bookingRequestId,
      subject: `Booking request received — ${params.businessName}`,
      text: [
        `Hi ${params.customerName},`,
        "",
        `Your booking request with ${params.businessName} was received.`,
        "",
        `Service: ${params.serviceName}`,
        `Requested: ${when}`,
        "",
        `Reference: ${params.bookingRequestId}`,
        "",
        "The business will confirm your appointment shortly.",
      ].join("\n"),
    });
  }

  if (prefs?.notifyOwnerNewBooking === false) return;

  const ownerEmails = await getOrgNotifierEmails(params.organizationId);
  for (const to of ownerEmails) {
    await sendAndLogEmail({
      organizationId: params.organizationId,
      to,
      recipientType: "owner",
      template: "new_booking_request",
      relatedType: "booking_request",
      relatedId: params.bookingRequestId,
      subject: `New booking request — ${params.customerName}`,
      text: [
        "You have a new booking request.",
        "",
        `Customer: ${params.customerName} (${params.customerEmail})`,
        `Service: ${params.serviceName}`,
        `Requested: ${when}`,
        "",
        `View in UpNext: ${appBaseUrl()}/app/bookings/${params.bookingRequestId}`,
      ].join("\n"),
    });
  }
}

export async function notifyBookingAccepted(organizationId: string, bookingRequestId: string): Promise<void> {
  const booking = await prisma.bookingRequest.findFirst({
    where: { id: bookingRequestId, organizationId },
    include: {
      customer: true,
      service: true,
      addons: true,
      organization: { include: { businessProfile: true } },
    },
  });
  if (!booking || !booking.customer.email) return;

  const ctx = await getOrgDisplayContext(organizationId);
  if (!ctx) return;

  const serviceName =
    booking.addons.length > 0
      ? `${booking.service.name} + ${booking.addons.map((a) => a.name).join(", ")}`
      : booking.service.name;
  const when = formatDisplayDateTime(booking.requestedStartAt, ctx.timeZone);
  const name = `${booking.customer.firstName} ${booking.customer.lastName}`.trim();

  await sendAndLogEmail({
    organizationId,
    to: booking.customer.email,
    recipientType: "customer",
    template: "booking_accepted",
    relatedType: "booking_request",
    relatedId: bookingRequestId,
    subject: `Booking confirmed — ${ctx.businessName}`,
    text: [
      `Hi ${name},`,
      "",
      `Your appointment with ${ctx.businessName} is confirmed.`,
      "",
      `Service: ${serviceName}`,
      `When: ${when}`,
      "",
      contactFooter(ctx.phone, ctx.email),
    ].join("\n"),
  });
}

export async function notifyBookingDeclined(organizationId: string, bookingRequestId: string): Promise<void> {
  const booking = await prisma.bookingRequest.findFirst({
    where: { id: bookingRequestId, organizationId },
    include: { customer: true, service: true },
  });
  if (!booking || !booking.customer.email) return;

  const ctx = await getOrgDisplayContext(organizationId);
  if (!ctx) return;

  const when = formatDisplayDateTime(booking.requestedStartAt, ctx.timeZone);
  const name = `${booking.customer.firstName} ${booking.customer.lastName}`.trim();

  await sendAndLogEmail({
    organizationId,
    to: booking.customer.email,
    recipientType: "customer",
    template: "booking_declined",
    relatedType: "booking_request",
    relatedId: bookingRequestId,
    subject: `Booking update — ${ctx.businessName}`,
    text: [
      `Hi ${name},`,
      "",
      `Unfortunately ${ctx.businessName} is unable to accept your booking request for ${booking.service.name} on ${when}.`,
      "",
      "Please choose another time or contact the business directly.",
      contactFooter(ctx.phone, ctx.email),
    ].join("\n"),
  });
}

export async function notifyRecurringJobScheduled(
  organizationId: string,
  jobId: string,
  frequency: import("@/generated/prisma/client").BookingFrequency,
): Promise<void> {
  const job = await prisma.job.findFirst({
    where: { id: jobId, organizationId },
    include: { customer: true, service: true },
  });
  if (!job || !job.customer.email) return;

  const ctx = await getOrgDisplayContext(organizationId);
  if (!ctx) return;

  const when = formatDisplayDateTime(job.scheduledStartAt, ctx.timeZone);
  const name = `${job.customer.firstName} ${job.customer.lastName}`.trim();
  const freq =
    frequency === "weekly"
      ? "Weekly"
      : frequency === "biweekly"
        ? "Bi-weekly"
        : frequency === "monthly"
          ? "Monthly"
          : "Recurring";

  await sendAndLogEmail({
    organizationId,
    to: job.customer.email,
    recipientType: "customer",
    template: "recurring_job_scheduled",
    relatedType: "job",
    relatedId: jobId,
    subject: `Upcoming ${freq.toLowerCase()} visit — ${ctx.businessName}`,
    text: [
      `Hi ${name},`,
      "",
      `Your next ${freq.toLowerCase()} appointment with ${ctx.businessName} is scheduled.`,
      "",
      `Service: ${job.service.name}`,
      `When: ${when}`,
      "",
      contactFooter(ctx.phone, ctx.email),
    ].join("\n"),
  });
}

export async function notifyJobAssigned(organizationId: string, jobId: string, membershipId: string): Promise<void> {
  const assignment = await prisma.jobAssignment.findFirst({
    where: { jobId, membershipId, job: { organizationId } },
    include: {
      job: { include: { customer: true, customerAddress: true } },
      membership: { include: { user: true } },
    },
  });
  if (!assignment?.membership.user.email) return;

  const ctx = await getOrgDisplayContext(organizationId);
  if (!ctx) return;

  const job = assignment.job;
  const when = formatDisplayDateTime(job.scheduledStartAt, ctx.timeZone);
  const address = job.customerAddress
    ? [job.customerAddress.line1, job.customerAddress.city, job.customerAddress.region]
        .filter(Boolean)
        .join(", ")
    : "See job details in UpNext";

  await sendAndLogEmail({
    organizationId,
    to: assignment.membership.user.email,
    recipientType: "worker",
    template: "crew_job_assigned",
    relatedType: "job",
    relatedId: jobId,
    subject: `Job assigned — ${job.title}`,
    text: [
      `You have been assigned a job.`,
      "",
      `Service: ${job.title}`,
      `Customer: ${job.customer.firstName} ${job.customer.lastName}`,
      `When: ${when}`,
      `Address: ${address}`,
      "",
      `Open in crew view: ${appBaseUrl()}/crew/jobs/${jobId}`,
    ].join("\n"),
  });
}

export async function notifyJobCompleted(organizationId: string, jobId: string): Promise<void> {
  const job = await prisma.job.findFirst({
    where: { id: jobId, organizationId },
    include: { customer: true },
  });
  if (!job || !job.customer.email) return;

  const prefs = await getNotificationPreferences(organizationId);
  if (prefs?.notifyCustomerJobCompleted === false) return;

  const ctx = await getOrgDisplayContext(organizationId);
  if (!ctx) return;

  const name = `${job.customer.firstName} ${job.customer.lastName}`.trim();

  await sendAndLogEmail({
    organizationId,
    to: job.customer.email,
    recipientType: "customer",
    template: "job_completed",
    relatedType: "job",
    relatedId: jobId,
    subject: `Service complete — ${ctx.businessName}`,
    text: [
      `Hi ${name},`,
      "",
      `Your ${job.title} service with ${ctx.businessName} is complete. Thank you!`,
      "",
      job.completionNotes ? `Notes: ${job.completionNotes}` : "",
      contactFooter(ctx.phone, ctx.email),
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

export async function notifyPaymentRequest(
  organizationId: string,
  jobId: string,
  paymentUrl: string | null,
): Promise<void> {
  const job = await prisma.job.findFirst({
    where: { id: jobId, organizationId },
    include: { customer: true, paymentRecord: true },
  });
  if (!job || !job.customer.email || !job.paymentRecord) return;

  const prefs = await getNotificationPreferences(organizationId);
  if (prefs?.notifyCustomerPaymentRequest === false) return;

  const ctx = await getOrgDisplayContext(organizationId);
  if (!ctx) return;

  const name = `${job.customer.firstName} ${job.customer.lastName}`.trim();
  const amount = formatMoney(job.paymentRecord.amountCents, job.paymentRecord.currency);

  await sendAndLogEmail({
    organizationId,
    to: job.customer.email,
    recipientType: "customer",
    template: "payment_request",
    relatedType: "payment",
    relatedId: job.paymentRecord.id,
    subject: `Payment request — ${ctx.businessName}`,
    text: [
      `Hi ${name},`,
      "",
      `Please submit payment of ${amount} for ${job.title} with ${ctx.businessName}.`,
      "",
      paymentUrl ? `Pay online: ${paymentUrl}` : "Contact the business for payment options.",
      contactFooter(ctx.phone, ctx.email),
    ].join("\n"),
  });
}

export async function notifyBookingRescheduled(
  organizationId: string,
  bookingRequestId: string,
): Promise<void> {
  const booking = await prisma.bookingRequest.findFirst({
    where: { id: bookingRequestId, organizationId },
    include: { customer: true, service: true, addons: true },
  });
  if (!booking || !booking.customer.email) return;

  const ctx = await getOrgDisplayContext(organizationId);
  if (!ctx) return;

  const serviceName =
    booking.addons.length > 0
      ? `${booking.service.name} + ${booking.addons.map((a) => a.name).join(", ")}`
      : booking.service.name;
  const when = formatDisplayDateTime(booking.requestedStartAt, ctx.timeZone);
  const name = `${booking.customer.firstName} ${booking.customer.lastName}`.trim();

  await sendAndLogEmail({
    organizationId,
    to: booking.customer.email,
    recipientType: "customer",
    template: "booking_rescheduled",
    relatedType: "booking_request",
    relatedId: bookingRequestId,
    subject: `Appointment updated — ${ctx.businessName}`,
    text: [
      `Hi ${name},`,
      "",
      `Your booking request with ${ctx.businessName} has been moved.`,
      "",
      `Service: ${serviceName}`,
      `New time: ${when}`,
      "",
      contactFooter(ctx.phone, ctx.email),
    ].join("\n"),
  });
}

export async function notifyJobRescheduled(organizationId: string, jobId: string): Promise<void> {
  const job = await prisma.job.findFirst({
    where: { id: jobId, organizationId },
    include: { customer: true },
  });
  if (!job || !job.customer.email) return;

  const ctx = await getOrgDisplayContext(organizationId);
  if (!ctx) return;

  const when = formatDisplayDateTime(job.scheduledStartAt, ctx.timeZone);
  const name = `${job.customer.firstName} ${job.customer.lastName}`.trim();

  await sendAndLogEmail({
    organizationId,
    to: job.customer.email,
    recipientType: "customer",
    template: "job_rescheduled",
    relatedType: "job",
    relatedId: jobId,
    subject: `Appointment rescheduled — ${ctx.businessName}`,
    text: [
      `Hi ${name},`,
      "",
      `Your ${job.title} appointment with ${ctx.businessName} has been rescheduled.`,
      "",
      `New time: ${when}`,
      "",
      contactFooter(ctx.phone, ctx.email),
    ].join("\n"),
  });
}

export async function notifyJobOnTheWay(organizationId: string, jobId: string): Promise<void> {
  const job = await prisma.job.findFirst({
    where: { id: jobId, organizationId },
    include: { customer: true },
  });
  if (!job || !job.customer.email) return;

  const already = await wasNotificationSent({
    organizationId,
    template: "job_on_the_way",
    relatedId: jobId,
    recipientEmail: job.customer.email,
  });
  if (already) return;

  const ctx = await getOrgDisplayContext(organizationId);
  if (!ctx) return;

  const when = formatDisplayDateTime(job.scheduledStartAt, ctx.timeZone);
  const name = `${job.customer.firstName} ${job.customer.lastName}`.trim();

  await sendAndLogEmail({
    organizationId,
    to: job.customer.email,
    recipientType: "customer",
    template: "job_on_the_way",
    relatedType: "job",
    relatedId: jobId,
    subject: `On the way — ${ctx.businessName}`,
    text: [
      `Hi ${name},`,
      "",
      `Your ${ctx.businessName} crew is on the way for your ${job.title} appointment (${when}).`,
      "",
      contactFooter(ctx.phone, ctx.email),
    ].join("\n"),
  });
}

export async function notifyJobRunningLate(
  organizationId: string,
  jobId: string,
  etaMinutes?: number,
): Promise<void> {
  const job = await prisma.job.findFirst({
    where: { id: jobId, organizationId },
    include: { customer: true },
  });
  if (!job || !job.customer.email) return;

  const ctx = await getOrgDisplayContext(organizationId);
  if (!ctx) return;

  const when = formatDisplayDateTime(job.scheduledStartAt, ctx.timeZone);
  const name = `${job.customer.firstName} ${job.customer.lastName}`.trim();
  const etaLine = etaMinutes
    ? `We expect to arrive in about ${etaMinutes} minutes.`
    : "We are running a bit behind schedule and will update you soon.";

  await sendAndLogEmail({
    organizationId,
    to: job.customer.email,
    recipientType: "customer",
    template: "job_running_late",
    relatedType: "job",
    relatedId: jobId,
    subject: `Running late — ${ctx.businessName}`,
    text: [
      `Hi ${name},`,
      "",
      `We're running late for your ${job.title} appointment scheduled for ${when}.`,
      "",
      etaLine,
      "",
      contactFooter(ctx.phone, ctx.email),
    ].join("\n"),
  });
}

export async function sendJobReminderIfDue(
  organizationId: string,
  jobId: string,
  template: "booking_reminder_24h" | "booking_reminder_2h",
): Promise<boolean> {
  const job = await prisma.job.findFirst({
    where: { id: jobId, organizationId, status: { in: ["scheduled", "confirmed"] } },
    include: { customer: true },
  });
  if (!job || !job.customer.email) return false;

  const prefs = await getNotificationPreferences(organizationId);
  if (template === "booking_reminder_24h" && prefs?.notifyCustomerReminder24h === false) {
    return false;
  }
  if (template === "booking_reminder_2h" && prefs?.notifyCustomerReminder2h === false) {
    return false;
  }

  const already = await wasNotificationSent({
    organizationId,
    template,
    relatedId: jobId,
    recipientEmail: job.customer.email,
  });
  if (already) return false;

  const ctx = await getOrgDisplayContext(organizationId);
  if (!ctx) return false;

  const when = formatDisplayDateTime(job.scheduledStartAt, ctx.timeZone);
  const name = `${job.customer.firstName} ${job.customer.lastName}`.trim();
  const lead = template === "booking_reminder_24h" ? "tomorrow" : "in about 2 hours";

  await sendAndLogEmail({
    organizationId,
    to: job.customer.email,
    recipientType: "customer",
    template,
    relatedType: "job",
    relatedId: jobId,
    subject: `Reminder: ${job.title} ${lead} — ${ctx.businessName}`,
    text: [
      `Hi ${name},`,
      "",
      `This is a reminder that your ${job.title} appointment with ${ctx.businessName} is scheduled for ${when}.`,
      contactFooter(ctx.phone, ctx.email),
    ].join("\n"),
  });

  return true;
}

export async function processJobReminders(): Promise<{ sent24h: number; sent2h: number }> {
  const now = Date.now();
  const windows = [
    { template: "booking_reminder_24h" as const, minMs: 23 * 60 * 60 * 1000, maxMs: 25 * 60 * 60 * 1000 },
    { template: "booking_reminder_2h" as const, minMs: 90 * 60 * 1000, maxMs: 150 * 60 * 1000 },
  ];

  let sent24h = 0;
  let sent2h = 0;

  for (const window of windows) {
    const jobs = await prisma.job.findMany({
      where: {
        status: { in: ["scheduled", "confirmed"] },
        scheduledStartAt: {
          gte: new Date(now + window.minMs),
          lte: new Date(now + window.maxMs),
        },
      },
      select: { id: true, organizationId: true },
    });

    for (const job of jobs) {
      const sent = await sendJobReminderIfDue(job.organizationId, job.id, window.template);
      if (sent) {
        if (window.template === "booking_reminder_24h") sent24h++;
        else sent2h++;
      }
    }
  }

  return { sent24h, sent2h };
}

export async function notifyTeamInvite(organizationId: string, inviteId: string): Promise<void> {
  const invite = await prisma.teamInvite.findFirst({
    where: { id: inviteId, organizationId },
    include: {
      organization: { include: { businessProfile: true } },
      invitedBy: { include: { user: true } },
    },
  });
  if (!invite || invite.acceptedAt) return;

  const businessName = invite.organization.businessProfile?.displayName ?? invite.organization.name;
  const inviter = invite.invitedBy.user.name ?? invite.invitedBy.user.email;
  const acceptUrl = `${appBaseUrl()}/accept-invite/${invite.token}`;

  await sendAndLogEmail({
    organizationId,
    to: invite.email,
    recipientType: "worker",
    template: "team_invite",
    relatedType: "team_invite",
    relatedId: invite.id,
    subject: `You're invited to join ${businessName} on UpNext`,
    text: [
      `Hi,`,
      "",
      `${inviter} invited you to join ${businessName} on UpNext as a ${invite.role}.`,
      "",
      `Accept your invite and set up crew access:`,
      acceptUrl,
      "",
      `This link expires in 7 days.`,
    ].join("\n"),
  });
}

export async function notifyCustomerPortalLink(params: {
  organizationId: string;
  customerId: string;
  tokenId: string;
  customerEmail: string;
  customerName: string;
  businessName: string;
  authUrl: string;
}): Promise<void> {
  await sendAndLogEmail({
    organizationId: params.organizationId,
    to: params.customerEmail,
    recipientType: "customer",
    template: "customer_portal_link",
    relatedType: "customer_portal_token",
    relatedId: params.tokenId,
    subject: `Your ${params.businessName} customer portal link`,
    text: [
      `Hi ${params.customerName || "there"},`,
      "",
      `Open your customer portal for ${params.businessName} to view bookings, book again, and manage appointments:`,
      params.authUrl,
      "",
      `This link expires in 15 minutes. If you didn't request this, you can ignore this email.`,
    ].join("\n"),
  });
}

export async function notifyBookingCancelledByCustomer(
  organizationId: string,
  bookingRequestId: string,
): Promise<void> {
  const booking = await prisma.bookingRequest.findFirst({
    where: { id: bookingRequestId, organizationId },
    include: {
      customer: true,
      service: true,
      organization: {
        include: {
          businessProfile: true,
          memberships: {
            where: { status: "active", role: { in: ["owner", "admin", "dispatcher"] } },
            include: { user: true },
          },
        },
      },
    },
  });
  if (!booking) return;

  const businessName =
    booking.organization.businessProfile?.displayName ?? booking.organization.name;
  const customerName = `${booking.customer.firstName} ${booking.customer.lastName}`.trim();

  await sendAndLogEmail({
    organizationId,
    to: booking.customer.email,
    recipientType: "customer",
    template: "booking_cancelled_by_customer",
    relatedType: "booking_request",
    relatedId: booking.id,
    subject: `Your booking with ${businessName} was cancelled`,
    text: [
      `Hi ${customerName},`,
      "",
      `Your ${booking.service.name} booking has been cancelled as requested.`,
      "",
      `Need another visit? Book again anytime.`,
    ].join("\n"),
  });

  for (const m of booking.organization.memberships) {
    if (!m.user.email) continue;
    await sendAndLogEmail({
      organizationId,
      to: m.user.email,
      recipientType: "owner",
      template: "booking_cancelled_by_customer",
      relatedType: "booking_request",
      relatedId: booking.id,
      subject: `Customer cancelled: ${customerName}`,
      text: [
        `${customerName} cancelled their ${booking.service.name} booking request.`,
        "",
        `Review in your inbox: ${appBaseUrl()}/app/bookings/${booking.id}`,
      ].join("\n"),
    });
  }
}
