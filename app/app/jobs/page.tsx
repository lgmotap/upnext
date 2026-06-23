import Link from "next/link";
import { Card, PageHeader, Avatar, AppButton } from "@/components/app/ui";
import { StatusBadge } from "@/components/app/StatusBadge";
import { jobs, formatMoney } from "@/lib/mock/data";

export default function JobsPage() {
  return (
    <>
      <PageHeader
        title="Jobs"
        subtitle="Every confirmed job, its assignee, status, and payment."
        action={<AppButton>+ New job</AppButton>}
      />

      <Card className="overflow-hidden">
        {/* header row */}
        <div className="hidden grid-cols-[1.6fr_1fr_0.8fr_0.8fr_0.7fr] gap-3 border-b border-ink-100 px-5 py-3 text-xs font-bold uppercase tracking-wide text-ink-400 md:grid">
          <span>Customer</span>
          <span>Service</span>
          <span>When</span>
          <span>Status</span>
          <span className="text-right">Payment</span>
        </div>
        <ul className="divide-y divide-ink-100">
          {jobs.map((j) => (
            <li key={j.id}>
              <Link
                href={`/app/jobs/${j.id}`}
                className="grid grid-cols-1 gap-2 px-5 py-3.5 hover:bg-ink-50/60 md:grid-cols-[1.6fr_1fr_0.8fr_0.8fr_0.7fr] md:items-center md:gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar initials={j.customer.split(" ").map((w) => w[0]).slice(0, 2).join("")} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-950">{j.customer}</p>
                    <p className="truncate text-xs text-ink-400">{j.address}</p>
                  </div>
                </div>
                <span className="text-sm text-ink-600">{j.service}</span>
                <span className="text-sm text-ink-600">{j.date} · {j.start}</span>
                <span><StatusBadge status={j.status} /></span>
                <span className="flex items-center justify-between gap-2 md:justify-end">
                  <span className="text-sm font-semibold text-ink-900">{formatMoney(j.priceCents)}</span>
                  <StatusBadge status={j.payment} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
