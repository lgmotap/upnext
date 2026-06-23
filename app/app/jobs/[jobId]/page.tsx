import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Clock, Wrench, Check, Camera, Send } from "lucide-react";
import { Card, CardHeader, Avatar, AppButton } from "@/components/app/ui";
import { StatusBadge } from "@/components/app/StatusBadge";
import { jobs, checklist, formatMoney } from "@/lib/mock/data";

export default async function JobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const job = jobs.find((j) => j.id === jobId);
  if (!job) notFound();

  const done = checklist.filter((c) => c.done).length;

  return (
    <>
      <Link href="/app/jobs" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-900">
        <ArrowLeft className="size-4" /> Back to jobs
      </Link>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-ink-950">{job.customer}</h1>
            <StatusBadge status={job.status} />
          </div>
          <p className="mt-1 text-sm text-ink-500">{job.service} · {job.date} at {job.start}</p>
        </div>
        <AppButton>Mark complete</AppButton>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Details" />
            <dl className="grid gap-3 p-5 sm:grid-cols-2">
              <Detail icon={MapPin} label="Address" value={job.address} />
              <Detail icon={Clock} label="Scheduled" value={`${job.date} · ${job.start}`} />
              <Detail icon={Wrench} label="Service" value={job.service} />
              <Detail icon={Clock} label="Price" value={formatMoney(job.priceCents)} />
            </dl>
          </Card>

          <Card>
            <CardHeader title={`Checklist · ${done}/${checklist.length}`} />
            <ul className="divide-y divide-ink-100">
              {checklist.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-5 py-3">
                  <span
                    className={`flex size-5 items-center justify-center rounded-md ${
                      c.done ? "bg-brand-400 text-brand-950" : "ring-1 ring-ink-300"
                    }`}
                  >
                    {c.done && <Check className="size-3.5" strokeWidth={3} />}
                  </span>
                  <span className={`text-sm ${c.done ? "text-ink-500 line-through" : "text-ink-800"}`}>{c.label}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Photos" />
            <div className="flex flex-wrap gap-3 p-5">
              {["from-brand-200 to-brand-400", "from-amber-200 to-amber-400", "from-ink-100 to-ink-200"].map((g, i) => (
                <div key={i} className={`size-20 rounded-xl bg-gradient-to-br ${g}`} />
              ))}
              <button className="flex size-20 flex-col items-center justify-center gap-1 rounded-xl text-ink-400 ring-1 ring-dashed ring-ink-300 hover:text-brand-700 hover:ring-brand-400">
                <Camera className="size-5" />
                <span className="text-[10px] font-medium">Add</span>
              </button>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Assigned" />
            <div className="flex items-center gap-3 p-5">
              <Avatar initials={job.assigneeInitials} className="size-10" />
              <div>
                <p className="text-sm font-semibold text-ink-950">{job.assignee}</p>
                <p className="text-xs text-ink-500">Field crew</p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Payment" action={<StatusBadge status={job.payment} />} />
            <div className="space-y-2.5 p-5">
              <p className="text-2xl font-bold text-ink-950">{formatMoney(job.priceCents)}</p>
              <button className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-400 py-2.5 text-sm font-bold text-brand-950 hover:bg-brand-300">
                <Send className="size-4" /> Send payment link
              </button>
              <button className="w-full rounded-full py-2.5 text-sm font-semibold text-ink-700 ring-1 ring-ink-200 hover:bg-ink-100">
                Mark as paid
              </button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function Detail({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex size-7 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
        <Icon className="size-3.5" />
      </span>
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</dt>
        <dd className="text-sm font-medium text-ink-900">{value}</dd>
      </div>
    </div>
  );
}
