/** RFC 4180-ish CSV parser for customer import (no extra dependency). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ",") {
      row.push(field);
      field = "";
      continue;
    }

    if (ch === "\n" || (ch === "\r" && next === "\n")) {
      row.push(field);
      field = "";
      if (row.some((cell) => cell.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      if (ch === "\r") i++;
      continue;
    }

    if (ch === "\r") {
      row.push(field);
      field = "";
      if (row.some((cell) => cell.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    field += ch;
  }

  row.push(field);
  if (row.some((cell) => cell.trim() !== "")) {
    rows.push(row);
  }

  return rows;
}

export const CUSTOMER_IMPORT_HEADERS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "line1",
  "line2",
  "city",
  "region",
  "postalCode",
  "country",
] as const;

export function customerImportTemplateCsv(): string {
  const header = CUSTOMER_IMPORT_HEADERS.join(",");
  const example = [
    "Jane",
    "Doe",
    "jane@example.com",
    "555-0100",
    "123 Main St",
    "Apt 2",
    "Austin",
    "TX",
    "78701",
    "US",
  ]
    .map((v) => `"${v}"`)
    .join(",");
  return `${header}\n${example}\n`;
}

export function rowsToObjects(rows: string[][]): Record<string, string>[] {
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((cells) => {
    const obj: Record<string, string> = {};
    header.forEach((key, i) => {
      obj[key] = (cells[i] ?? "").trim();
    });
    return obj;
  });
}
