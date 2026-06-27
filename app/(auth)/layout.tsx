import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { BookedFoxLogo } from "@/components/brand/BookedFoxLogo";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

const points = ["Online booking page", "Jobs, calendar & crew", "Payments in one place"];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-950 p-10 text-white lg:flex">
        <div className="absolute inset-0 bg-grid opacity-[0.18] [mask-image:radial-gradient(closest-side,black,transparent_90%)]" />
        <div className="absolute -bottom-24 -right-16 size-[28rem] rounded-full bg-[radial-gradient(closest-side,rgba(253,95,3,0.2),transparent)]" />
        <BookedFoxLogo href="/" theme="dark" className="relative" />

        <div className="relative">
          <p className="text-3xl font-extrabold leading-snug text-white">
            Run your service business from{" "}
            <span className="text-brand-400 italic">one workspace.</span>
          </p>
          <ul className="mt-6 space-y-2.5">
            {points.map((p) => (
              <li key={p} className="flex items-center gap-2 text-white/80">
                <span className="flex size-5 items-center justify-center rounded-full bg-brand-400/20">
                  <Check className="size-3 text-brand-400" strokeWidth={3} />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/40">© {new Date().getFullYear()} BookedFox</p>
      </div>

      <div className="flex items-center justify-center bg-background px-5 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
