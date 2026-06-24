import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock, Plus } from "lucide-react";
import { Card, PageHeader } from "@/components/app/ui";
import { formatMoney } from "@/lib/money/format";
import { getAppSession } from "@/server/permissions/session";
import { canManageServices } from "@/server/permissions/can";
import { listServicesForOrg } from "@/server/repositories/services";
import { listChecklistTemplateForService } from "@/server/repositories/checklists";
import { toggleServiceAction } from "@/server/actions/services";
import { ServiceForm } from "./ServiceForm";

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; new?: string; edit?: string }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/sign-in?next=/app/services");

  const params = await searchParams;
  const services = await listServicesForOrg(session.organizationId);
  const canEdit = canManageServices(session);
  const editing = params.edit ? services.find((s) => s.id === params.edit) : null;
  const showNew = params.new === "1" || Boolean(editing);
  const editingChecklist = editing
    ? (await listChecklistTemplateForService(session.organizationId, editing.id))
        .map((item) => item.label)
        .join("\n")
    : "";

  return (
    <>
      <PageHeader
        title="Services"
        subtitle="What customers can book, with duration and price."
        action={
          canEdit ? (
            <Link
              href={showNew ? "/app/services" : "/app/services?new=1"}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-400 px-4 py-2 text-sm font-bold text-brand-950 hover:bg-brand-300"
            >
              <Plus className="size-4" /> {showNew ? "Cancel" : "Add service"}
            </Link>
          ) : undefined
        }
      />

      {params.error && (
        <p className="mb-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-rose-100">
          {params.error}
        </p>
      )}

      {showNew && canEdit && (
        <Card className="mb-6 p-5">
          <h2 className="mb-4 text-sm font-bold text-ink-950">
            {editing ? "Edit service" : "New service"}
          </h2>
          <ServiceForm service={editing ?? undefined} checklistItems={editingChecklist} />
        </Card>
      )}

      {services.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-ink-500">No services yet. Add your first bookable service.</p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Card key={s.id} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-ink-950">{s.name}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    s.isActive ? "bg-brand-100 text-brand-800" : "bg-ink-100 text-ink-500"
                  }`}
                >
                  {s.isActive ? "Active" : "Hidden"}
                </span>
              </div>
              {s.description && <p className="mt-1 text-xs text-ink-500 line-clamp-2">{s.description}</p>}
              <p className="mt-3 text-2xl font-bold text-ink-950">
                {formatMoney(s.basePriceCents, s.currency)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-500">
                <span className="inline-flex items-center">
                  <Clock className="mr-1 size-3.5" /> {s.durationMinutes} min
                </span>
                {s.isAddon && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">
                    Add-on
                  </span>
                )}
                {s.isPublic && <span className="ml-auto text-brand-700">Public</span>}
              </div>
              {canEdit && (
                <div className="mt-4 flex gap-2 border-t border-ink-100 pt-3">
                  <Link
                    href={`/app/services?edit=${s.id}`}
                    className="flex-1 rounded-full py-2 text-center text-xs font-semibold text-ink-700 ring-1 ring-ink-200 hover:bg-ink-100"
                  >
                    Edit
                  </Link>
                  <form action={toggleServiceAction} className="flex-1">
                    <input type="hidden" name="serviceId" value={s.id} />
                    <button
                      type="submit"
                      className="w-full rounded-full py-2 text-xs font-semibold text-ink-500 hover:bg-ink-100"
                    >
                      {s.isActive ? "Hide" : "Show"}
                    </button>
                  </form>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
