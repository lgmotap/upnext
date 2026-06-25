import { site } from "@/lib/config";
import {
  bookedfoxEmailLayout,
  emailBrand,
  emailButton,
  escapeHtml,
} from "@/lib/email/bookedfox-layout";

export type WaitlistThankYouParams = {
  firstName: string;
  businessName: string;
};

export function waitlistThankYouSubject(): string {
  return `You're on the ${site.name} early access list`;
}

export function waitlistThankYouText({ firstName, businessName }: WaitlistThankYouParams): string {
  return [
    `Hi ${firstName},`,
    "",
    `Thanks for joining the ${site.name} early access waitlist!`,
    "",
    `We've saved your spot for ${businessName}. You're among the first service business owners who will get access before our public launch.`,
    "",
    "What happens next:",
    "• We'll email you when early access opens",
    "• You'll get product updates and launch offers first",
    "• No spam — just launch news and your invite",
    "",
    site.url,
    "",
    `— The ${site.name} team`,
  ].join("\n");
}

export function waitlistThankYouHtml({ firstName, businessName }: WaitlistThankYouParams): string {
  const name = escapeHtml(firstName);
  const business = escapeHtml(businessName);

  const bodyHtml = `
    <h1 style="margin:0 0 12px;font-size:26px;line-height:1.25;font-weight:800;color:${emailBrand.greenDark};letter-spacing:-0.02em;">
      You're on the list 🎉
    </h1>
    <p style="margin:0 0 20px;font-size:16px;line-height:1.65;color:${emailBrand.ink};">
      Hi ${name}, thanks for joining the <strong>${escapeHtml(site.name)}</strong> early access waitlist.
    </p>
    <p style="margin:0 0 24px;font-size:16px;line-height:1.65;color:${emailBrand.ink};">
      We've saved your spot for <strong>${business}</strong>. You're among the first home-service business owners who'll get access before our public launch.
    </p>
    <div style="background-color:${emailBrand.cream};border-radius:16px;padding:20px 22px;margin:0 0 8px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${emailBrand.greenMuted};">
        What happens next
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
        <tr>
          <td style="padding:6px 0;font-size:15px;line-height:1.5;color:${emailBrand.ink};vertical-align:top;width:24px;">✓</td>
          <td style="padding:6px 0 6px 8px;font-size:15px;line-height:1.5;color:${emailBrand.ink};">We'll email you when early access opens</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:15px;line-height:1.5;color:${emailBrand.green};vertical-align:top;">✓</td>
          <td style="padding:6px 0 6px 8px;font-size:15px;line-height:1.5;color:${emailBrand.ink};">Product updates and launch offers, before anyone else</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:15px;line-height:1.5;color:${emailBrand.green};vertical-align:top;">✓</td>
          <td style="padding:6px 0 6px 8px;font-size:15px;line-height:1.5;color:${emailBrand.ink};">No spam — just launch news and your invite</td>
        </tr>
      </table>
    </div>
    ${emailButton(site.url, `Visit ${site.name}`)}
    <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:${emailBrand.inkMuted};text-align:center;">
      Questions? Just reply to this email — we read every message.
    </p>`;

  return bookedfoxEmailLayout({
    preheader: `You're on the ${site.name} early access list. We'll be in touch before launch.`,
    bodyHtml,
  });
}
