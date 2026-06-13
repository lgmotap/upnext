import { CheckCircle2 } from "lucide-react";
import { cta } from "@/lib/config";
import { CTAButton, PrimaryCTA } from "@/components/ui/CTAButton";
import { HandNote } from "@/components/ui/HandNote";
import { DashboardMockup } from "@/components/mockups/DashboardMockup";
import { MobileMockup } from "@/components/mockups/MobileMockup";
import { SprayBottle, Calendar3D, PayCard } from "@/components/three-d/Objects";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* layered backdrop: cobalt glow + coral warmth + dotted grid + grain */}
      <div className="absolute inset-0 -z-30 bg-gradient-to-b from-brand-50 via-background to-background" />
      <div className="absolute inset-0 -z-20 bg-grid opacity-60 [mask-image:radial-gradient(closest-side,black,transparent_85%)]" />
      <div className="absolute -top-40 left-1/4 -z-20 h-[34rem] w-[48rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(45,75,224,0.16),transparent)]" />
      <div className="absolute -right-32 top-24 -z-20 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(closest-side,rgba(255,107,94,0.14),transparent)]" />
      <div className="texture-grain pointer-events-none absolute inset-0 -z-10 opacity-[0.05]" />

      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1fr_1.1fr] lg:gap-10">
        {/* copy */}
        <div className="text-center lg:text-left">
          <p className="mb-5 inline-flex -rotate-2 items-center gap-2 rounded-xl bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-700 ring-1 ring-ink-200 shadow-soft">
            <span className="size-1.5 rounded-full bg-accent-500" />
            Booking &amp; business software for home service pros
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-ink-950 sm:text-5xl xl:text-[3.4rem] xl:leading-[1.08] text-balance">
            The easiest way to{" "}
            <span className="relative whitespace-nowrap text-accent-500">
              get booked
              <svg viewBox="0 0 220 12" className="absolute -bottom-1 left-0 w-full text-accent-400" aria-hidden>
                <path d="M3 9 Q60 2 110 6 T217 5" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" />
              </svg>
            </span>{" "}
            and run your service business
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-600 lg:mx-0 text-pretty">
            UpNext gives solo and team home-service providers a professional online booking page —
            plus scheduling, customers, your team, and payments in one place. No more spreadsheets,
            scattered texts, or missed calls.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <PrimaryCTA size="lg" />
            <CTAButton variant="secondary" size="lg" href={cta.secondary.href}>
              {cta.secondary.label}
            </CTAButton>
          </div>

          <p className="mt-5 flex items-center justify-center gap-2 text-sm text-ink-500 lg:justify-start">
            <CheckCircle2 className="size-4 shrink-0 text-brand-500" aria-hidden />
            Get early access before the public launch — spots are limited.
          </p>

          <p className="mt-3 text-xs text-ink-400 text-pretty">{cta.microcopy}</p>
        </div>

        {/* visual */}
        <div className="relative mx-auto w-full max-w-2xl">
          <DashboardMockup className="lg:rotate-1" />
          <MobileMockup className="absolute -bottom-12 -right-2 hidden origin-bottom-right scale-[0.6] sm:block lg:-right-10 lg:-rotate-3 lg:scale-[0.68]" />

          {/* floating 3D objects — fewer, on-palette */}
          <SprayBottle className="animate-float absolute -left-8 -top-10 w-16 sm:-left-12 sm:w-20 [--tilt:-8deg]" />
          <Calendar3D className="animate-float-delayed absolute -right-4 -top-12 w-14 sm:w-16 [--tilt:7deg]" />
          <PayCard className="animate-float-late absolute -left-10 bottom-20 w-20 sm:-left-14 sm:w-24 [--tilt:-6deg]" />

          {/* hand-drawn annotation */}
          <HandNote
            direction="down-right"
            rotate="-6deg"
            className="absolute -left-6 top-16 hidden w-28 lg:block"
            arrowClassName="ml-10 w-8"
          >
            real booking requests!
          </HandNote>
        </div>
      </div>
    </section>
  );
}
