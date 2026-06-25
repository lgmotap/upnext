import { prisma } from "@/lib/db/prisma";
import type { WaitlistLeadInput } from "@/server/validators/waitlist";

export function findWaitlistLeadByEmail(email: string) {
  return prisma.waitlistLead.findUnique({ where: { email } });
}

export function createWaitlistLead(input: WaitlistLeadInput & { email: string }) {
  return prisma.waitlistLead.create({
    data: {
      email: input.email,
      firstName: input.firstName,
      businessName: input.businessName,
      businessType: input.businessType || null,
      businessSize: input.businessSize || null,
      currentTool: input.currentTool || null,
      source: input.source || null,
    },
  });
}

export function markWaitlistThankYouSent(id: string) {
  return prisma.waitlistLead.update({
    where: { id },
    data: { thankYouSentAt: new Date() },
  });
}

export function countWaitlistLeads() {
  return prisma.waitlistLead.count();
}
