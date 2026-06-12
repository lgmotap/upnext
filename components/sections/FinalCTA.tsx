import { Section } from "@/components/ui/Section";
import { PrimaryCTA } from "@/components/ui/CTAButton";
import { cta } from "@/lib/config";
import { Sparkle, PayCard, Checklist3D, Bubbles } from "@/components/three-d/Objects";

export function FinalCTA() {
  return (
    <Section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-brand-50 to-background" />
      <div className="relative mx-auto max-w-3xl rounded-[2.5rem] bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-16 text-center text-white shadow-float sm:px-16">
        <Sparkle className="animate-float absolute -left-5 -top-5 w-12 opacity-90" />
        <PayCard className="animate-float-delayed absolute -right-6 top-8 hidden w-20 sm:block [--tilt:8deg]" />
        <Checklist3D className="animate-float-late absolute -bottom-6 left-8 hidden w-16 sm:block [--tilt:-7deg]" />
        <Bubbles className="absolute bottom-4 right-10 hidden w-14 opacity-60 sm:block" />

        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-balance">
          Ready to run your service business with less admin?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-brand-100 text-pretty">
          Join the waitlist and be one of the first to try the platform before the public launch.
        </p>
        <div className="mt-8">
          <PrimaryCTA className="!bg-white !text-brand-800 hover:!bg-brand-50" />
        </div>
        <p className="mt-4 text-sm font-medium text-brand-200">{cta.supporting}</p>
      </div>
    </Section>
  );
}
