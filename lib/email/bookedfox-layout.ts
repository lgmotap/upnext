import { site } from "@/lib/config";

/** BookedFox brand tokens for HTML email (inline-safe). Mirrors `app/globals.css` brand scale. */
export const emailBrand = {
  navy: "#051A3D",
  navyMuted: "#0A2550",
  orange: "#FD5F03",
  orangeDark: "#E55503",
  softBg: "#F6F8FB",
  ink: "#051A3D",
  inkMuted: "#5C6878",
  white: "#FFFFFF",
} as const;

/** Absolute URL for the horizontal logo (hosted on bookedfox.com / app origin). */
export function emailLogoUrl(): string {
  return `${site.url}/brand/logo-horizontal.png`;
}

type LayoutParams = {
  preheader: string;
  bodyHtml: string;
};

function emailLogoHeader(): string {
  const logoUrl = emailLogoUrl();
  return `<img
    src="${logoUrl}"
    alt="${escapeHtml(site.name)}"
    width="180"
    height="38"
    style="display:block;margin:0 auto;height:38px;width:auto;max-width:220px;border:0;"
  />`;
}

/** Branded wrapper for transactional/marketing emails. */
export function bookedfoxEmailLayout({ preheader, bodyHtml }: LayoutParams): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${site.name}</title>
</head>
<body style="margin:0;padding:0;background-color:${emailBrand.softBg};font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${emailBrand.ink};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${emailBrand.softBg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;">
          <tr>
            <td style="padding:0 0 24px;text-align:center;">
              ${emailLogoHeader()}
            </td>
          </tr>
          <tr>
            <td style="background-color:${emailBrand.white};border-radius:20px;padding:36px 32px;box-shadow:0 4px 24px rgba(5,26,61,0.08);">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 8px 0;text-align:center;font-size:12px;line-height:1.6;color:${emailBrand.inkMuted};">
              <p style="margin:0 0 8px;">© ${year} ${escapeHtml(site.name)} · Booking software for home-service businesses</p>
              <p style="margin:0;"><a href="${site.url}" style="color:${emailBrand.orange};text-decoration:none;font-weight:600;">${site.url.replace(/^https:\/\//, "")}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const paragraphStyle = `margin:0 0 16px;font-size:16px;line-height:1.65;color:${emailBrand.ink};`;

function linkify(text: string): string {
  return text.replace(
    /(https?:\/\/[^\s<]+)/g,
    `<a href="$1" style="color:${emailBrand.orange};text-decoration:none;font-weight:600;">$1</a>`,
  );
}

function inferButtonLabel(context: string): string {
  const lower = context.toLowerCase();
  if (lower.includes("pay")) return "Pay online";
  if (lower.includes("invite") || lower.includes("accept")) return "Accept invite";
  if (lower.includes("portal")) return "Open portal";
  if (lower.includes("crew")) return "Open in crew view";
  if (lower.includes("view") || lower.includes("bookings")) return "View in app";
  return "Open link";
}

function renderContactBlock(lines: string[]): string {
  const items = lines.slice(1).map((line) => `<p style="margin:0 0 4px;font-size:15px;line-height:1.5;color:${emailBrand.ink};">${escapeHtml(line)}</p>`);
  return `<div style="background-color:${emailBrand.softBg};border-radius:16px;padding:16px 18px;margin:8px 0 0;">
    <p style="margin:0 0 8px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${emailBrand.navyMuted};">Contact</p>
    ${items.join("")}
  </div>`;
}

function renderTextBlock(block: string): string {
  const lines = block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return "";

  if (lines[0] === "Contact:") {
    return renderContactBlock(lines);
  }

  const lastLine = lines[lines.length - 1] ?? "";
  const endsWithUrl = /^https?:\/\//.test(lastLine);

  if (endsWithUrl && lines.length === 1) {
    return emailButton(lastLine, inferButtonLabel(block));
  }

  if (endsWithUrl && lines.length > 1) {
    const text = lines.slice(0, -1).join(" ");
    return `<p style="${paragraphStyle}">${linkify(escapeHtml(text))}</p>${emailButton(lastLine, inferButtonLabel(text))}`;
  }

  const html = linkify(escapeHtml(block).replace(/\n/g, "<br />"));
  return `<p style="${paragraphStyle}">${html}</p>`;
}

/** Wrap plain-text notification copy in the BookedFox HTML layout. */
export function plainTextEmailHtml(text: string, preheader: string): string {
  const blocks = text.split(/\n\n+/).map((block) => block.trim()).filter(Boolean);
  const bodyHtml = blocks.map(renderTextBlock).join("\n");
  return bookedfoxEmailLayout({ preheader, bodyHtml });
}

export function emailButton(href: string, label: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:20px auto 0;">
  <tr>
    <td style="border-radius:999px;background:${emailBrand.orange};">
      <a href="${href}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:${emailBrand.white};text-decoration:none;">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>`;
}

/** Prepend sandbox redirect note when Resend test mode rewrites the recipient. */
export function withSandboxHtmlBanner(html: string, intendedTo: string, actualTo: string): string {
  if (actualTo.toLowerCase() === intendedTo.toLowerCase()) return html;
  const banner = `<p style="margin:0 0 16px;font-size:12px;color:${emailBrand.inkMuted};">Sandbox: intended for ${escapeHtml(intendedTo)}</p>`;
  return html.replace(
    /(<td style="background-color:[^"]+;border-radius:20px;padding:36px 32px[^>]*>)/,
    `$1${banner}`,
  );
}
