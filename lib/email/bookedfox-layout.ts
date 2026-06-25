import { site } from "@/lib/config";

/** BookedFox brand tokens for HTML email (inline-safe). */
export const emailBrand = {
  green: "#1fb863",
  greenLight: "#3ad079",
  greenDark: "#0c3a2c",
  greenMuted: "#117a44",
  cream: "#f7f5ef",
  ink: "#15191b",
  inkMuted: "#5c6569",
  white: "#ffffff",
} as const;

type LayoutParams = {
  preheader: string;
  bodyHtml: string;
};

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
<body style="margin:0;padding:0;background-color:${emailBrand.cream};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${emailBrand.ink};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${emailBrand.cream};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;">
          <tr>
            <td style="padding:0 0 24px;text-align:center;">
              <div style="display:inline-block;background:linear-gradient(135deg,${emailBrand.greenLight},${emailBrand.green});color:${emailBrand.greenDark};font-weight:800;font-size:18px;letter-spacing:-0.02em;padding:10px 18px;border-radius:999px;">
                ${escapeHtml(site.name)}
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color:${emailBrand.white};border-radius:20px;padding:36px 32px;box-shadow:0 4px 24px rgba(12,58,44,0.08);">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 8px 0;text-align:center;font-size:12px;line-height:1.6;color:${emailBrand.inkMuted};">
              <p style="margin:0 0 8px;">© ${year} ${escapeHtml(site.name)} · Booking software for home-service businesses</p>
              <p style="margin:0;"><a href="${site.url}" style="color:${emailBrand.greenMuted};text-decoration:none;">${site.url.replace(/^https:\/\//, "")}</a></p>
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

export function emailButton(href: string, label: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px auto 0;">
  <tr>
    <td style="border-radius:999px;background:linear-gradient(135deg,${emailBrand.greenLight},${emailBrand.green});">
      <a href="${href}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:${emailBrand.greenDark};text-decoration:none;">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>`;
}
