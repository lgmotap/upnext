import type { ReportingExportRow } from "@/server/services/reporting";

export const REPORT_EXPORT_HEADERS = [
  "date",
  "customer",
  "service",
  "job_status",
  "amount",
  "payment_status",
] as const;

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildReportsExportCsv(rows: ReportingExportRow[]): string {
  const lines = [REPORT_EXPORT_HEADERS.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.date,
        row.customer,
        row.service,
        row.jobStatus,
        row.amount,
        row.paymentStatus,
      ]
        .map(escapeCsv)
        .join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}
