import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Crew",
  robots: { index: false, follow: false },
};

export default function CrewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-background">
      <header className="sticky top-0 z-20 bg-brand-950 px-5 py-4 text-white">
        <Link href="/crew" className="flex items-center">
          <span className="text-lg font-bold tracking-tight">UpNext</span>
          <span className="ml-0.5 mt-1.5 size-1.5 rounded-full bg-brand-400" />
          <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/80">Crew</span>
        </Link>
      </header>
      {children}
    </div>
  );
}
