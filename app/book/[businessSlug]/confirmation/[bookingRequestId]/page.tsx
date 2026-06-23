import { Check, Mail, Clock } from "lucide-react";
import { business } from "@/lib/mock/data";

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ businessSlug: string; bookingRequestId: string }>;
}) {
  await params;
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-12 text-ink-900">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-brand-400 text-brand-950">
          <Check className="size-8" strokeWidth={3} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-950">Request sent!</h1>
        <p className="mt-2 text-ink-600">
          {business.name} will confirm your booking shortly. A confirmation email is on its way.
        </p>

        <div className="mt-6 space-y-2.5 rounded-3xl bg-white p-5 text-left ring-1 ring-ink-100 shadow-soft">
          <Row icon={Clock} label="Requested" value="Tue, Jun 17 · 11:00 AM" />
          <Row icon={Check} label="Service" value="Deep Clean · $220" />
          <Row icon={Mail} label="Confirmation to" value="you@example.com" />
        </div>

        <p className="mt-6 text-xs text-ink-400">
          Powered by <span className="font-semibold text-ink-600">UpNext</span>
        </p>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
        <Icon className="size-4" />
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p>
        <p className="text-sm font-semibold text-ink-900">{value}</p>
      </div>
    </div>
  );
}
