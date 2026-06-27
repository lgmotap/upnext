import { site } from "@/lib/config";

/** BookedFox brand tokens for HTML email (inline-safe). */
export const emailBrand = {
  navy: "#051A3D",
  navyMuted: "#0a2550",
  orange: "#FD5F03",
  orangeDark: "#e55503",
  softBg: "#F6F8FB",
  ink: "#051A3D",
  inkMuted: "#5c6878",
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
<body style="margin:0;padding:0;background-color:${emailBrand.softBg};font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${emailBrand.ink};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${emailBrand.softBg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;">
          <tr>
            <td style="padding:0 0 24px;text-align:center;">
              <div style="display:inline-block;background:${emailBrand.navy};color:${emailBrand.white};font-weight:800;font-size:18px;letter-spacing:-0.02em;padding:12px 20px;border-radius:12px;">
                <span style="color:${emailBrand.white};">Booked</span><span style="color:${emailBrand.orange};">Fox</span>
              </div>
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
              <p style="margin:0;"><a href="${site.url}" style="color:${emailBrand.orange};text-decoration:none;">${site.url.replace(/^https:\/\//, "")}</a></p>
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
    <td style="border-radius:999px;background:${emailBrand.orange};">
      <a href="${href}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:${emailBrand.white};text-decoration:none;">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>`;
}
