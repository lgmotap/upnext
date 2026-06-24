"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseCsv, rowsToObjects, CUSTOMER_IMPORT_HEADERS } from "@/lib/customers/csv";
import { checkRateLimit } from "@/lib/rate-limit";
import { getAppSession } from "@/server/permissions/session";
import { canManageBookings } from "@/server/permissions/can";
import {
  CUSTOMER_IMPORT_MAX_ROWS,
  customerImportRowSchema,
} from "@/server/validators/customer-import";
import { importCustomerRow } from "@/server/services/customer-import";

const RESULT_COOKIE = "upnext_customer_import_result";

export type CustomerImportResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; message: string }[];
};

function importRedirect(params: Record<string, string>): never {
  const qs = new URLSearchParams(params).toString();
  redirect(qs ? `/app/customers/import?${qs}` : "/app/customers/import");
}

export async function importCustomersAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageBookings(session)) {
    importRedirect({ error: "You do not have permission to import customers." });
  }

  if (!checkRateLimit(`customer-import:${session.organizationId}`, 5, 60 * 60 * 1000)) {
    importRedirect({ error: "Import limit reached. Try again in an hour." });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    importRedirect({ error: "Choose a CSV file to import." });
  }

  if (file.size > 512_000) {
    importRedirect({ error: "File is too large (max 512 KB)." });
  }

  const text = await file.text();
  const matrix = parseCsv(text);
  const objects = rowsToObjects(matrix);

  if (objects.length === 0) {
    importRedirect({ error: "CSV is empty or missing data rows." });
  }

  const headerKeys = Object.keys(objects[0] ?? {});
  const missingHeaders = CUSTOMER_IMPORT_HEADERS.filter(
    (h) => h !== "line2" && h !== "phone" && h !== "country" && !headerKeys.includes(h),
  );
  if (!headerKeys.includes("firstName") || !headerKeys.includes("lastName") || !headerKeys.includes("email")) {
    importRedirect({
      error: "CSV must include firstName, lastName, and email columns. Download the template.",
    });
  }
  void missingHeaders;

  if (objects.length > CUSTOMER_IMPORT_MAX_ROWS) {
    importRedirect({ error: `CSV has too many rows (max ${CUSTOMER_IMPORT_MAX_ROWS}).` });
  }

  const result: CustomerImportResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  const seenEmails = new Set<string>();

  for (let i = 0; i < objects.length; i++) {
    const rowNumber = i + 2;
    const raw = objects[i];
    const emailKey = (raw.email ?? "").trim().toLowerCase();

    if (emailKey && seenEmails.has(emailKey)) {
      result.skipped += 1;
      result.errors.push({ row: rowNumber, message: "Duplicate email in this file" });
      continue;
    }
    if (emailKey) seenEmails.add(emailKey);

    const parsed = customerImportRowSchema.safeParse(raw);
    if (!parsed.success) {
      result.skipped += 1;
      const message =
        parsed.error.flatten().fieldErrors.email?.[0] ??
        parsed.error.flatten().fieldErrors.firstName?.[0] ??
        parsed.error.flatten().fieldErrors.lastName?.[0] ??
        parsed.error.issues[0]?.message ??
        "Invalid row";
      result.errors.push({ row: rowNumber, message });
      continue;
    }

    try {
      const outcome = await importCustomerRow(session.organizationId, parsed.data);
      if (outcome === "created") result.created += 1;
      else result.updated += 1;
    } catch {
      result.skipped += 1;
      result.errors.push({ row: rowNumber, message: "Could not save customer" });
    }
  }

  revalidatePath("/app/customers");

  const jar = await cookies();
  jar.set(RESULT_COOKIE, JSON.stringify(result), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 120,
  });

  importRedirect({ done: "1" });
}

export async function readCustomerImportResult(): Promise<CustomerImportResult | null> {
  const jar = await cookies();
  const raw = jar.get(RESULT_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CustomerImportResult;
  } catch {
    return null;
  }
}

export async function clearCustomerImportResult(): Promise<void> {
  const jar = await cookies();
  jar.delete(RESULT_COOKIE);
}
