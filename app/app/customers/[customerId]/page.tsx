import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, MapPin } from "lucide-react";
import { Card, CardHeader, StatCard, Avatar, AppButton } from "@/components/app/ui";
import { StatusBadge } from "@/components/app/StatusBadge";
import { customers, jobs, formatMoney } from "@/lib/mock/data";

export default async function CustomerDetailPage({ params }: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await params;
  const customer = customers.find((c) => c.id === customerId);
  if (!customer) notFound();

  const history = jobs.filter((j) => j.customerId === customer.id);

  return (
    <>
      <Link href="/app/customers" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-900">
        <ArrowLeft className="size-4" /> Back to customers
      </Link>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar initials={customer.name.split(" ").map((w) => w[0]).slice(0, 2).join("")} className="size-14 text-base" />
          <div>
            <h1 className="text-2xl font-bold text-ink-950">{customer.name}</h1>
            <p className="text-sm text-ink-500">{customer.contact}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {customer.tags.map((t) => (
                <span key={t} className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-brand-800">{t}</span>
              ))}
            </div>
          </div>
        </div>
        <AppButton>+ New job</AppButton>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Jobs" value={String(customer.jobs)} />
            <StatCard label="Lifetime value" value={formatMoney(customer.lifetimeCents)} />
            <StatCard label="Status" value="Active" />
          </div>

          <Card>
            <CardHeader title="Job history" />
            <ul className="divide-y divide-ink-100">
              {history.length === 0 && <li className="px-5 py-6 text-center text-sm text-ink-400">No jobs yet.</li>}
              {history.map((j) => (
                <li key={j.id}>
                  <Link href={`/app/jobs/${j.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-ink-50/60">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-950">{j.service}</p>
                      <p className="text-xs text-ink-500">{j.date} · {j.start}</p>
                    </div>
                    <span className="text-sm font-semibold text-ink-900">{formatMoney(j.priceCents)}</span>
                    <StatusBadge status={j.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader title="Contact" />
          <div className="space-y-3 p-5 text-sm text-ink-700">
            <p className="flex items-center gap-2"><Mail className="size-4 text-ink-400" /> {customer.email}</p>
            <p className="flex items-center gap-2"><Phone className="size-4 text-ink-400" /> {customer.phone}</p>
            <p className="flex items-start gap-2"><MapPin className="size-4 shrink-0 text-ink-400" /> {customer.address}</p>
          </div>
        </Card>
      </div>
    </>
  );
}
