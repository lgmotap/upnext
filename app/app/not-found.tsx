import Link from "next/link";
import { SearchX } from "lucide-react";

export default function AppNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
        <SearchX className="size-7" />
      </span>
      <h1 className="text-2xl font-bold text-ink-950">Not found</h1>
      <p className="mt-1 max-w-sm text-sm text-ink-500">
        We couldn&apos;t find what you were looking for. It may have been moved or removed.
      </p>
      <Link
        href="/app/dashboard"
        className="mt-5 inline-flex items-center rounded-full bg-brand-400 px-4 py-2 text-sm font-bold text-brand-950 hover:bg-brand-300"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
