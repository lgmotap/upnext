const PLACEHOLDER = /^(placeholder|changeme|your_|xxx|todo|replace_me)/i;

/** Resend test sender — only delivers to RESEND_SANDBOX_TO until a domain is verified. */
export const RESEND_TEST_FROM = "BookedFox <onboarding@resend.dev>";

/**
 * Production gate: verify a domain on the UpNext Resend account, set EMAIL_FROM to
 * that domain, and unset RESEND_SANDBOX_TO. See docs/13-notifications.md § Before production.
 */

export function isResendConfigured(): boolean {
  const key = process.env.RESEND_API_KEY?.trim() ?? "";
  return key.length >= 12 && !PLACEHOLDER.test(key);
}

export function emailFromAddress(): string {
  const from = process.env.EMAIL_FROM?.trim();
  if (from && !PLACEHOLDER.test(from)) return from;
  return RESEND_TEST_FROM;
}

/** True when using Resend's shared test domain (recipient allowlist applies). */
export function isResendSandboxMode(): boolean {
  if (process.env.RESEND_SANDBOX === "false") return false;
  if (process.env.RESEND_SANDBOX === "true") return true;
  return emailFromAddress().includes("@resend.dev");
}

export function resendSandboxInbox(): string | null {
  const inbox = process.env.RESEND_SANDBOX_TO?.trim();
  if (!inbox || PLACEHOLDER.test(inbox)) return null;
  return inbox;
}

/** Owner inbox for new waitlist lead alerts (e.g. WAITLIST_NOTIFY_EMAIL). */
export function waitlistNotifyInbox(): string | null {
  const inbox = process.env.WAITLIST_NOTIFY_EMAIL?.trim();
  if (!inbox || PLACEHOLDER.test(inbox)) return null;
  return inbox;
}

export type ResolvedRecipient = {
  to: string;
  subject: string;
  text: string;
  /** Original intended recipient when sandbox redirect applies. */
  intendedTo: string;
};

/** In sandbox mode, redirect non-allowlisted recipients to RESEND_SANDBOX_TO. */
export function resolveOutboundEmail(params: {
  to: string;
  subject: string;
  text: string;
}): ResolvedRecipient {
  const intendedTo = params.to;

  if (!isResendSandboxMode()) {
    return { to: intendedTo, subject: params.subject, text: params.text, intendedTo };
  }

  const inbox = resendSandboxInbox();
  if (!inbox || intendedTo.toLowerCase() === inbox.toLowerCase()) {
    return { to: intendedTo, subject: params.subject, text: params.text, intendedTo };
  }

  return {
    to: inbox,
    intendedTo,
    subject: `[Dev → ${intendedTo}] ${params.subject}`,
    text: [`(Sandbox: this email was intended for ${intendedTo})`, "", params.text].join("\n"),
  };
}
