import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

const points = ["Online booking page", "Jobs, calendar & crew", "Payments in one place"];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-950 p-10 text-white lg:flex">
        <div className="absolute inset-0 bg-grid opacity-[0.18] [mask-image:radial-gradient(closest-side,black,transparent_90%)]" />
        <div className="absolute -top-24 right-0 size-[28rem] rounded-full bg-[radial-gradient(closest-side,rgba(58,208,121,0.25),transparent)]" />
        <Link href="/" className="relative flex items-center">
          <span className="text-2xl font-bold tracking-tight">UpNext</span>
          <span className="ml-0.5 mt-2.5 size-2 rounded-full bg-brand-400" />
        </Link>
        <div className="relative">
          <p className="font-serif text-3xl italic leading-snug text-brand-300">
            Run your service business from one workspace.
          </p>
          <ul className="mt-6 space-y-2.5">
            {points.map((p) => (
              <li key={p} className="flex items-center gap-2 text-white/80">
                <span className="flex size-5 items-center justify-center rounded-full bg-brand-400/20">
                  <Check className="size-3 text-brand-300" strokeWidth={3} />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/40">© {new Date().getFullYear()} UpNext</p>
      </div>

      {/* form panel */}
      <div className="flex items-center justify-center bg-background px-5 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
