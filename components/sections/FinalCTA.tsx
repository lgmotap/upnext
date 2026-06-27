import { Section } from "@/components/ui/Section";
import { PrimaryCTA } from "@/components/ui/CTAButton";
import { Em } from "@/components/ui/Em";
import { cta } from "@/lib/config";
import { PayCard, Checklist3D } from "@/components/three-d/Objects";

export function FinalCTA() {
  return (
    <Section className="relative overflow-hidden">
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-900 to-brand-950 px-6 py-16 text-center text-white shadow-float sm:px-16">
        <div className="absolute inset-0 bg-grid opacity-[0.16] [mask-image:radial-gradient(closest-side,black,transparent_85%)]" />
        <div className="absolute -right-24 -top-20 size-72 rounded-full bg-[radial-gradient(closest-side,rgba(253,95,3,0.22),transparent)]" />
        <PayCard className="animate-float-delayed absolute -right-6 top-8 hidden w-20 sm:block [--tilt:8deg]" />
        <Checklist3D className="animate-float-late absolute -bottom-6 left-8 hidden w-16 sm:block [--tilt:-7deg]" />

        <h2 className="relative text-3xl font-bold tracking-tight sm:text-[2.7rem] sm:leading-[1.1] text-balance">
          Ready to run your service business with <Em className="text-brand-400">less admin?</Em>
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-lg leading-relaxed text-white/70 text-pretty">
          Join the waitlist and be one of the first to try the platform before the public launch.
        </p>
        <div className="relative mt-8">
          <PrimaryCTA />
        </div>
        <p className="relative mt-4 text-sm font-medium text-white/50">{cta.supporting}</p>
      </div>
    </Section>
  );
}
