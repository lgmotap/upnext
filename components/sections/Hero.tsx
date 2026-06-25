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
      {/* texture + soft glow */}
      <div className="absolute inset-0 -z-20 bg-grid opacity-[0.18] [mask-image:radial-gradient(closest-side,black,transparent_90%)]" />
      <div className="absolute -top-32 right-0 -z-20 h-[34rem] w-[44rem] rounded-full bg-[radial-gradient(closest-side,rgba(58,208,121,0.22),transparent)]" />
      <div className="texture-grain pointer-events-none absolute inset-0 -z-10 opacity-[0.04]" />

      {/* decorative green badge, Pluto-style */}
      <span className="absolute left-3 top-40 hidden size-11 items-center justify-center rounded-full bg-brand-400 text-brand-950 shadow-lg lg:flex">
        <RefreshCw className="size-5" aria-hidden />
      </span>

      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1fr_1.12fr] lg:gap-10">
        {/* copy */}
        <div className="text-center lg:text-left">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-200 ring-1 ring-white/15">
            <span className="size-1.5 rounded-full bg-brand-400" />
            Booking &amp; business software for home service pros
          </p>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl xl:text-[3.5rem] xl:leading-[1.06] text-balance">
            The easiest way to get{" "}
            <Em className="text-brand-300">booked</Em> and run your service business
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
                  <Check className="size-2.5 text-brand-300" strokeWidth={3} aria-hidden />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* visual */}
        <div className="relative mx-auto w-full max-w-2xl">
          <DashboardMockup className="lg:rotate-1" />
          <MobileMockup className="absolute -bottom-12 -right-2 hidden origin-bottom-right scale-[0.6] sm:block lg:-right-10 lg:-rotate-3 lg:scale-[0.68]" />
        </div>
      </div>
    </section>
  );
}
