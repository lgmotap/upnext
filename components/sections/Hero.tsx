import { Check, RefreshCw } from "lucide-react";
import { cta, site } from "@/lib/config";
import { CTAButton, PrimaryCTA } from "@/components/ui/CTAButton";
import { Em } from "@/components/ui/Em";
import { DashboardMockup } from "@/components/mockups/DashboardMockup";
import { MobileMockup } from "@/components/mockups/MobileMockup";

const trust = ["100% online booking", "Set up in minutes", "Solo or full crew"];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-brand-950 text-white">
      <div className="absolute inset-0 -z-20 bg-grid opacity-[0.18] [mask-image:radial-gradient(closest-side,black,transparent_90%)]" />
      <div className="absolute -bottom-32 -right-16 -z-20 h-[34rem] w-[44rem] rounded-full bg-[radial-gradient(closest-side,rgba(253,95,3,0.22),transparent)]" />
      <div className="texture-grain pointer-events-none absolute inset-0 -z-10 opacity-[0.04]" />

      <span className="absolute left-3 top-40 hidden size-11 items-center justify-center rounded-full bg-brand-400 text-white shadow-lg xl:flex">
        <RefreshCw className="size-5" aria-hidden />
      </span>

      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-12 lg:py-24">
        <div className="text-center lg:text-left">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/80 ring-1 ring-white/15">
            <span className="size-1.5 rounded-full bg-brand-400" />
            Booking &amp; business software for home service pros
          </p>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl xl:text-[3.5rem] xl:leading-[1.06] text-balance">
            The easiest way to get <Em className="text-brand-400">booked</Em> and run your service business
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/70 lg:mx-0 text-pretty">
            {site.name} gives solo and team home-service providers a professional online booking page —
            plus scheduling, customers, your team, and payments in one place. No more spreadsheets,
            scattered texts, or missed calls.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <PrimaryCTA size="lg" />
            <CTAButton
              variant="secondary"
              size="lg"
              href={cta.secondary.href}
              className="!bg-transparent !text-white !shadow-none ring-1 !ring-white/30 hover:!ring-white/70 hover:!text-white"
            >
              {cta.secondary.label}
            </CTAButton>
          </div>

          <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-white/70 lg:justify-start">
            {trust.map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <span className="flex size-4 items-center justify-center rounded-full bg-brand-400/20">
                  <Check className="size-2.5 text-brand-400" strokeWidth={3} aria-hidden />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Compact desktop + original phone overlay (nudged slightly right) */}
        <div className="flex w-full min-w-0 justify-center lg:justify-end">
          <div className="relative mx-auto w-full max-w-[440px] pb-10 sm:max-w-[480px] sm:pb-16 md:max-w-[520px] md:pb-20 lg:mx-0 lg:max-w-[540px] lg:pb-24 xl:max-w-[580px]">
            <DashboardMockup className="w-full lg:rotate-1" />
            <MobileMockup className="absolute -bottom-12 -right-4 hidden origin-bottom-right scale-[0.6] sm:block lg:-right-12 lg:-rotate-3 lg:scale-[0.68] xl:-right-14" />
          </div>
        </div>
      </div>
    </section>
  );
}
