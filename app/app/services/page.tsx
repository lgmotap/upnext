import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock, Plus, Sparkles } from "lucide-react";
import { Card, PageHeader } from "@/components/app/ui";
import { FormSubmitButton } from "@/components/app/FormSubmitButton";
import { formatMoney } from "@/lib/money/format";
import { catalogStats } from "@/lib/onboarding/industry-catalog";
import { getAppSession } from "@/server/permissions/session";
import { canManageServices } from "@/server/permissions/can";
import { listServicesForOrg } from "@/server/repositories/services";
import { listChecklistTemplateForService } from "@/server/repositories/checklists";
import { toggleServiceAction, seedSuggestedCatalogAction } from "@/server/actions/services";
import { prisma } from "@/lib/db/prisma";
import { ServiceForm } from "./ServiceForm";

function ServiceCard({
  s,
  canEdit,
}: {
  s: Awaited<ReturnType<typeof listServicesForOrg>>[number];
  canEdit: boolean;
}) {
  return (
    <Card className="p-5">
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
      <p className="mt-3 text-2xl font-bold text-ink-950">{formatMoney(s.basePriceCents, s.currency)}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-500">
        <span className="inline-flex items-center">
          <Clock className="mr-1 size-3.5" /> {s.durationMinutes} min
        </span>
        {s.isAddon && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">Add-on</span>
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
  );
}

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; new?: string; edit?: string; seeded?: string }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/sign-in?next=/app/services");

  const params = await searchParams;
  const [services, profile] = await Promise.all([
    listServicesForOrg(session.organizationId),
    prisma.businessProfile.findUnique({
      where: { organizationId: session.organizationId },
      select: { businessType: true },
    }),
  ]);
  const canEdit = canManageServices(session);
  const editing = params.edit ? services.find((s) => s.id === params.edit) : null;
  const showNew = params.new === "1" || Boolean(editing);
  const editingChecklist = editing
    ? (await listChecklistTemplateForService(session.organizationId, editing.id))
        .map((item) => item.label)
        .join("\n")
    : "";

  const businessType = profile?.businessType ?? "";
  const catalog = businessType ? catalogStats(businessType) : null;
  const primary = services.filter((s) => !s.isAddon);
  const addons = services.filter((s) => s.isAddon);
  const missingSuggested =
    catalog && services.length < catalog.totalCount && canEdit && businessType;

  return (
    <>
      <PageHeader
        title="Services"
        subtitle="Bookable services and add-ons customers choose on your booking page."
        action={
          canEdit ? (
            <div className="flex flex-wrap gap-2">
              {missingSuggested && (
                <form action={seedSuggestedCatalogAction}>
                  <FormSubmitButton
                    variant="outline"
                    loadingLabel="Adding…"
                    className="inline-flex items-center gap-1.5 !rounded-full"
                  >
                    <Sparkles className="size-4" /> Load suggested catalog
                  </FormSubmitButton>
                </form>
              )}
              <Link
                href={showNew ? "/app/services" : "/app/services?new=1"}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-400 px-4 py-2 text-sm font-bold text-brand-950 hover:bg-brand-300"
              >
                <Plus className="size-4" /> {showNew ? "Cancel" : "Add service"}
              </Link>
            </div>
          ) : undefined
        }
      />

      {params.error && (
        <p className="mb-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-rose-100">
          {decodeURIComponent(params.error)}
        </p>
      )}
      {params.seeded && (
        <p className="mb-4 rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-900 ring-1 ring-brand-100">
          Added {params.seeded} suggested services and add-ons from your industry template.
        </p>
      )}

      {catalog && services.length > 0 && (
        <p className="mb-4 text-sm text-ink-500">
          {catalog.label} template: {primary.length}/{catalog.primaryCount} services, {addons.length}/
          {catalog.addonCount} add-ons on your list.
        </p>
      )}

      {showNew && canEdit && (
        <Card className="mb-6 p-5">
          <h2 className="mb-4 text-sm font-bold text-ink-950">{editing ? "Edit service" : "New service"}</h2>
          <ServiceForm service={editing ?? undefined} checklistItems={editingChecklist} />
        </Card>
      )}

      {services.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-ink-500">
            No services yet.
            {businessType
              ? " Load the suggested catalog for your industry or add a service manually."
              : " Add your first bookable service."}
          </p>
          {missingSuggested && (
            <form action={seedSuggestedCatalogAction} className="mt-4">
              <FormSubmitButton loadingLabel="Adding…" className="inline-flex items-center gap-1.5">
                <Sparkles className="size-4" /> Load suggested catalog
              </FormSubmitButton>
            </form>
          )}
        </Card>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-400">Services</h2>
            {primary.length === 0 ? (
              <p className="text-sm text-ink-500">No primary services — add one or load the suggested catalog.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {primary.map((s) => (
                  <ServiceCard key={s.id} s={s} canEdit={canEdit} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-400">
              Add-ons &amp; extras
            </h2>
            {addons.length === 0 ? (
              <p className="text-sm text-ink-500">
                No add-ons yet. These appear as optional upgrades on your booking page.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {addons.map((s) => (
                  <ServiceCard key={s.id} s={s} canEdit={canEdit} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
