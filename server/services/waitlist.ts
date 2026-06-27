import { getResend } from "@/lib/resend/client";
import {
  emailFromAddress,
  isResendConfigured,
  resolveOutboundEmail,
} from "@/lib/resend/config";
import {
  waitlistThankYouHtml,
  waitlistThankYouSubject,
  waitlistThankYouText,
} from "@/lib/email/waitlist-thank-you";
import { withSandboxHtmlBanner } from "@/lib/email/bookedfox-layout";
import { checkRateLimit } from "@/lib/rate-limit";
import { Prisma } from "@/generated/prisma/client";
import {
  createWaitlistLead,
  findWaitlistLeadByEmail,
  markWaitlistThankYouSent,
} from "@/server/repositories/waitlist";
import type { WaitlistLeadInput } from "@/server/validators/waitlist";

export class WaitlistRateLimitError extends Error {
  constructor() {
    super("Too many waitlist sign-ups. Please try again later.");
    this.name = "WaitlistRateLimitError";
  }
}

async function sendWaitlistThankYouEmail(params: {
  email: string;
  firstName: string;
  businessName: string;
}): Promise<boolean> {
  const resend = getResend();
  if (!isResendConfigured() || !resend) {
    console.warn("[waitlist] RESEND_API_KEY not set — thank-you email skipped");
    return false;
  }

  const subject = waitlistThankYouSubject();
  const text = waitlistThankYouText(params);

  const outbound = resolveOutboundEmail({
    to: params.email,
    subject,
    text,
  });

  const html = withSandboxHtmlBanner(
    waitlistThankYouHtml(params),
    params.email,
    outbound.to,
  );

  const result = await resend.emails.send({
    from: emailFromAddress(),
    to: outbound.to,
    subject: outbound.subject,
    text: outbound.text,
    html,
  });

  if (result.error) {
    console.error("[waitlist] thank-you email failed:", result.error.message);
    return false;
  }

  return true;
}

/** Persist lead and send thank-you email (idempotent on duplicate email). */
export async function submitWaitlistLead(
  input: WaitlistLeadInput,
  rateLimitKey: string,
): Promise<{ stored: boolean; emailSent: boolean }> {
  if (!checkRateLimit(`waitlist:ip:${rateLimitKey}`, 8, 60 * 60 * 1000)) {
    throw new WaitlistRateLimitError();
  }

  const email = input.email.trim().toLowerCase();
  let lead = await findWaitlistLeadByEmail(email);
  let stored = false;

  if (!lead) {
    try {
      lead = await createWaitlistLead({ ...input, email });
      stored = true;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        lead = await findWaitlistLeadByEmail(email);
      } else {
        throw err;
      }
    }
  }

  if (!lead) {
    throw new Error("Waitlist lead could not be saved.");
  }

  let emailSent = Boolean(lead.thankYouSentAt);
  if (!lead.thankYouSentAt) {
    const sent = await sendWaitlistThankYouEmail({
      email: lead.email,
      firstName: lead.firstName,
      businessName: lead.businessName,
    });
    if (sent) {
      try {
        await markWaitlistThankYouSent(lead.id);
        emailSent = true;
      } catch (err) {
        console.error("[waitlist] thank-you timestamp update failed:", err);
      }
    }
  }

  return { stored, emailSent };
}
