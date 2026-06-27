import type { Metadata } from "next";
import { BookedFoxLogo } from "@/components/brand/BookedFoxLogo";

export const metadata: Metadata = {
  title: "Crew",
  robots: { index: false, follow: false },
};

export default function CrewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-background">
      <header className="sticky top-0 z-20 bg-brand-950 px-5 py-4 text-white">
        <div className="flex items-center gap-2">
          <BookedFoxLogo href="/crew" theme="dark" iconOnly />
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/80">Crew</span>
        </div>
      </header>
      {children}
    </div>
  );
}
