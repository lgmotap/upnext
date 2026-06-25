import { prisma } from "@/lib/db/prisma";
import type { PaymentStatus } from "@/generated/prisma/client";

export function listPaymentRecordsForCustomer(organizationId: string, customerId: string) {
  return prisma.paymentRecord.findMany({
    where: { organizationId, customerId },
    orderBy: { createdAt: "desc" },
    include: {
      job: { select: { id: true, title: true, scheduledStartAt: true } },
    },
  });
}

export function listPaymentRecordsForOrg(organizationId: string, status?: PaymentStatus) {
  return prisma.paymentRecord.findMany({
    where: { organizationId, ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
    include: {
      job: { select: { id: true, title: true, scheduledStartAt: true } },
      bookingRequest: {
        select: {
          id: true,
          requestedStartAt: true,
          service: { select: { name: true } },
        },
      },
      customer: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
}

export function getPaymentRecordForOrg(organizationId: string, paymentRecordId: string) {
  return prisma.paymentRecord.findFirst({
    where: { id: paymentRecordId, organizationId },
    include: {
      job: true,
      customer: true,
    },
  });
}

export function getPaymentRecordForJob(organizationId: string, jobId: string) {
  return prisma.paymentRecord.findFirst({
    where: { jobId, organizationId },
  });
}

export function createPaymentRecordForJob(data: {
  organizationId: string;
  jobId: string;
  customerId: string;
  amountCents: number;
  currency: string;
}) {
  return prisma.paymentRecord.create({
    data: {
      organizationId: data.organizationId,
      jobId: data.jobId,
      customerId: data.customerId,
      amountCents: data.amountCents,
      currency: data.currency,
      status: "not_requested",
      provider: "manual",
    },
  });
}

export async function paymentAggregatesForOrg(organizationId: string) {
  const rows = await prisma.paymentRecord.groupBy({
    by: ["status"],
    where: { organizationId },
    _sum: { amountCents: true },
    _count: true,
  });

  let collectedCents = 0;
  let outstandingCents = 0;
  let overdueCents = 0;

  for (const row of rows) {
    const cents = row._sum.amountCents ?? 0;
    if (row.status === "paid") collectedCents += cents;
    if (row.status === "pending") outstandingCents += cents;
    if (row.status === "overdue") overdueCents += cents;
  }

  return { collectedCents, outstandingCents, overdueCents };
}

export function getOrgStripeConnect(organizationId: string) {
  return prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      stripeConnectAccountId: true,
      stripeConnectChargesEnabled: true,
    },
  });
}

export function markWebhookEventProcessed(eventId: string, type: string, organizationId?: string) {
  return prisma.stripeWebhookEvent.create({
    data: { id: eventId, type, organizationId: organizationId ?? null },
  });
}

export function wasWebhookEventProcessed(eventId: string) {
  return prisma.stripeWebhookEvent.findUnique({ where: { id: eventId } });
}
