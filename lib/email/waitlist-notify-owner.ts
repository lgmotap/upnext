import { site } from "@/lib/config";
import { escapeHtml } from "@/lib/email/bookedfox-layout";

export type WaitlistNotifyParams = {
  firstName: string;
  email: string;
  businessName: string;
  businessType: string | null;
  businessSize: string | null;
  currentTool: string | null;
  source: string | null;
  createdAt: Date;
};

export function waitlistNotifyOwnerSubject(params: WaitlistNotifyParams): string {
  return `New waitlist lead: ${params.businessName}`;
}

export function waitlistNotifyOwnerText(params: WaitlistNotifyParams): string {
  const lines = [
    "New BookedFox waitlist sign-up",
    "",
    `Name: ${params.firstName}`,
    `Email: ${params.email}`,
    `Business: ${params.businessName}`,
    params.businessType ? `Service type: ${params.businessType}` : null,
    params.businessSize ? `Team size: ${params.businessSize}` : null,
    params.currentTool ? `Current tool: ${params.currentTool}` : null,
    params.source ? `Source: ${params.source}` : null,
    `Signed up: ${params.createdAt.toISOString()}`,
    "",
    site.url,
  ];
  return lines.filter(Boolean).join("\n");
}

export function waitlistNotifyOwnerHtml(params: WaitlistNotifyParams): string {
  const rows: [string, string][] = [
    ["Name", params.firstName],
    ["Email", params.email],
    ["Business", params.businessName],
    ...(params.businessType ? ([["Service type", params.businessType]] as [string, string][]) : []),
    ...(params.businessSize ? ([["Team size", params.businessSize]] as [string, string][]) : []),
    ...(params.currentTool ? ([["Current tool", params.currentTool]] as [string, string][]) : []),
    ...(params.source ? ([["Source", params.source]] as [string, string][]) : []),
    [
      "Signed up",
      params.createdAt.toLocaleString("en-US", { timeZone: "America/New_York" }) + " ET",
    ],
  ];

  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px 8px 0;font-size:13px;font-weight:600;color:#5c6878;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td><td style="padding:8px 0;font-size:15px;color:#051A3D;">${escapeHtml(String(value))}</td></tr>`,
    )
    .join("");

  return `<h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#051A3D;">New waitlist lead</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#051A3D;"><strong>${escapeHtml(params.businessName)}</strong> just joined the ${escapeHtml(site.name)} waitlist.</p>
<table role="presentation" cellspacing="0" cellpadding="0">${tableRows}</table>`;
}
