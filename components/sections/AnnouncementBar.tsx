import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { announcement } from "@/lib/config";

export function AnnouncementBar() {
  return (
    <div className="bg-brand-950 text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-5 py-2.5 text-center text-xs sm:text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-400/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand-300">
          <Sparkles className="size-3" /> {announcement.badge}
        </span>
        <p className="text-white/70">{announcement.message}</p>
        <Link
          href={announcement.href}
          className="inline-flex items-center gap-1 font-semibold text-brand-300 underline-offset-4 hover:text-brand-200 hover:underline"
        >
          {announcement.linkLabel} <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
