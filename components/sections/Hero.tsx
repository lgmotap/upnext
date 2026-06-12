import { CheckCircle2 } from "lucide-react";
import { cta } from "@/lib/config";
import { CTAButton, PrimaryCTA } from "@/components/ui/CTAButton";
import { DashboardMockup } from "@/components/mockups/DashboardMockup";
import { MobileMockup } from "@/components/mockups/MobileMockup";
import { SprayBottle, Sparkle, Calendar3D, PayCard, Bubbles } from "@/components/three-d/Objects";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* soft gradient backdrop */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 via-background to-background" />
      <div className="absolute -top-40 left-1/2 -z-10 h-[34rem] w-[60rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(76,186,176,0.18),transparent)]" />

      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1fr_1.1fr] lg:gap-10">
        {/* copy */}
        <div className="text-center lg:text-left">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700 ring-1 ring-brand-200 shadow-soft">
            <span className="size-1.5 rounded-full bg-brand-500" />
            Built for local service businesses
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-ink-950 sm:text-5xl xl:text-[3.4rem] xl:leading-[1.08] text-balance">
            Run your service business from{" "}
            <span className="relative whitespace-nowrap text-brand-600">
              one simple
              <svg viewBox="0 0 220 12" className="absolute -bottom-1 left-0 w-full text-brand-300" aria-hidden>
                <path d="M3 9 Q60 2 110 6 T217 5" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" />
              </svg>
            </span>{" "}
            dashboard
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-600 lg:mx-0 text-pretty">
            Launch a professional booking experience, manage jobs, organize your team, and get paid
            — without messy spreadsheets, scattered chats, or manual admin work.
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
          <DashboardMockup />
          <MobileMockup className="absolute -bottom-12 -right-2 hidden origin-bottom-right scale-[0.6] sm:block lg:-right-8 lg:scale-[0.68]" />

          {/* floating 3D objects */}
          <SprayBottle className="animate-float absolute -left-8 -top-10 w-16 sm:-left-12 sm:w-20 [--tilt:-8deg]" />
          <Calendar3D className="animate-float-delayed absolute -right-4 -top-12 w-16 sm:w-20 [--tilt:7deg]" />
          <PayCard className="animate-float-late absolute -left-10 bottom-16 w-20 sm:-left-14 sm:w-24 [--tilt:-6deg]" />
          <Sparkle className="animate-float-delayed absolute -bottom-6 left-1/4 w-10 sm:w-12" />
          <Bubbles className="animate-float absolute right-1/4 -top-8 w-12 opacity-90 sm:w-14" />
        </div>
      </div>
    </section>
  );
}
