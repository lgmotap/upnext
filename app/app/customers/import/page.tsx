import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { Card, PageHeader } from "@/components/app/ui";
import { FormSubmitButton } from "@/components/app/FormSubmitButton";
import { customerImportTemplateCsv } from "@/lib/customers/csv";
import { CUSTOMER_IMPORT_MAX_ROWS } from "@/server/validators/customer-import";
import { getAppSession } from "@/server/permissions/session";
import { canManageBookings } from "@/server/permissions/can";
import {
  clearCustomerImportResult,
  importCustomersAction,
  readCustomerImportResult,
} from "@/server/actions/customer-import";

export default async function CustomerImportPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; done?: string }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/sign-in?next=/app/customers/import");
  if (!canManageBookings(session)) redirect("/app/customers?error=denied");

  const params = await searchParams;
  const result = params.done === "1" ? await readCustomerImportResult() : null;
  if (result) {
    await clearCustomerImportResult();
  }

  const template = customerImportTemplateCsv();

  return (
    <>
      <PageHeader
        title="Import customers"
        subtitle={`Upload a CSV with up to ${CUSTOMER_IMPORT_MAX_ROWS} customers. Existing emails are updated.`}
        action={
          <Link
            href="/app/customers"
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50"
          >
            <ArrowLeft className="size-4" /> Back to customers
          </Link>
        }
      />

      {params.error && (
        <p className="mb-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-rose-100">
          {decodeURIComponent(params.error)}
        </p>
      )}

      {result && (
        <Card className="mb-6 p-5">
          <h2 className="text-sm font-bold text-ink-950">Import complete</h2>
          <ul className="mt-3 grid gap-2 text-sm text-ink-700 sm:grid-cols-3">
            <li>
              <span className="font-bold text-brand-800">{result.created}</span> created
            </li>
            <li>
              <span className="font-bold text-ink-900">{result.updated}</span> updated
            </li>
            <li>
              <span className="font-bold text-ink-500">{result.skipped}</span> skipped
            </li>
          </ul>
          {result.errors.length > 0 && (
            <div className="mt-4 rounded-xl bg-ink-50 p-4 ring-1 ring-ink-100">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-400">Row errors</p>
              <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-sm text-ink-700">
                {result.errors.slice(0, 25).map((e) => (
                  <li key={`${e.row}-${e.message}`}>
                    Row {e.row}: {e.message}
                  </li>
                ))}
              </ul>
              {result.errors.length > 25 && (
                <p className="mt-2 text-xs text-ink-500">
                  …and {result.errors.length - 25} more errors
                </p>
              )}
            </div>
          )}
          <Link
            href="/app/customers"
            className="mt-4 inline-flex text-sm font-semibold text-brand-700 hover:underline"
          >
            View customers
          </Link>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-sm font-bold text-ink-950">1. Download template</h2>
          <p className="mt-1 text-sm text-ink-500">
            Columns: firstName, lastName, email, phone, line1, line2, city, region, postalCode,
            country.
          </p>
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(template)}`}
            download="upnext-customers-template.csv"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-4 py-2 text-sm font-semibold text-ink-800 hover:bg-ink-200"
          >
            <Download className="size-4" /> Download CSV template
          </a>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-bold text-ink-950">2. Upload your file</h2>
          <p className="mt-1 text-sm text-ink-500">
            Duplicate emails in your org are updated. Duplicate emails within the same file are
            skipped.
          </p>
          <form action={importCustomersAction} className="mt-4 space-y-4">
            <input
              type="file"
              name="file"
              accept=".csv,text/csv"
              required
              className="block w-full text-sm text-ink-600 file:mr-3 file:rounded-full file:border-0 file:bg-brand-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-900 hover:file:bg-brand-200"
            />
            <FormSubmitButton loadingLabel="Importing…">Import customers</FormSubmitButton>
          </form>
        </Card>
      </div>
    </>
  );
}
