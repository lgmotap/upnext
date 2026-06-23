import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Check, Camera, Navigation } from "lucide-react";
import { StatusBadge } from "@/components/app/StatusBadge";
import { jobs, checklist } from "@/lib/mock/data";

export default async function CrewJobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const job = jobs.find((j) => j.id === jobId);
  if (!job) notFound();

  const done = checklist.filter((c) => c.done).length;

  return (
    <div className="px-4 py-5">
      <Link href="/crew" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-ink-500">
        <ArrowLeft className="size-4" /> Today
      </Link>

      <div className="rounded-2xl bg-white p-4 ring-1 ring-ink-100 shadow-soft">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-ink-950">{job.start}</span>
          <StatusBadge status={job.status} />
        </div>
        <h1 className="mt-1 text-xl font-bold text-ink-950">{job.customer}</h1>
        <p className="text-sm text-ink-500">{job.service}</p>
        <a
          href="#"
          className="mt-3 flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2.5 text-sm text-ink-700"
        >
          <span className="inline-flex items-center gap-1.5"><MapPin className="size-4 text-ink-400" /> {job.address}</span>
          <span className="inline-flex items-center gap-1 font-semibold text-brand-700"><Navigation className="size-3.5" /> Directions</span>
        </a>
      </div>

      {/* checklist */}
      <div className="mt-3 rounded-2xl bg-white p-4 ring-1 ring-ink-100 shadow-soft">
        <p className="mb-3 text-sm font-bold text-ink-950">Checklist · {done}/{checklist.length}</p>
        <ul className="space-y-2">
          {checklist.map((c) => (
            <li key={c.id} className="flex items-center gap-3">
              <span className={`flex size-6 items-center justify-center rounded-md ${c.done ? "bg-brand-400 text-brand-950" : "ring-1 ring-ink-300"}`}>
                {c.done && <Check className="size-4" strokeWidth={3} />}
              </span>
              <span className={`text-sm ${c.done ? "text-ink-500 line-through" : "text-ink-800"}`}>{c.label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* photos */}
      <div className="mt-3 rounded-2xl bg-white p-4 ring-1 ring-ink-100 shadow-soft">
        <p className="mb-3 text-sm font-bold text-ink-950">Photos</p>
        <div className="flex gap-2.5">
          <div className="size-16 rounded-xl bg-gradient-to-br from-brand-200 to-brand-400" />
          <button className="flex size-16 flex-col items-center justify-center gap-1 rounded-xl text-ink-400 ring-1 ring-dashed ring-ink-300">
            <Camera className="size-5" />
            <span className="text-[10px]">Add</span>
          </button>
        </div>
      </div>

      <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-brand-400 py-4 text-base font-bold text-brand-950">
        <Check className="size-5" /> Mark job complete
      </button>
      <div className="h-6" />
    </div>
  );
}
