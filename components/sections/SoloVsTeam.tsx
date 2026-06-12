import { User, Users, Check } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { PrimaryCTA } from "@/components/ui/CTAButton";

const solo = [
  "Look like an established business from day one",
  "Take booking requests online instead of over endless texts",
  "Keep every customer, job, and payment in one place",
  "Automated reminders so nothing slips while you're on a job",
  "Simple enough to run from your phone between jobs",
];

const team = [
  "Assign jobs and see everyone's day at a glance",
  "Color-coded team calendar with availability and open slots",
  "Job checklists and notes so quality stays consistent",
  "Track who's done what — and what's been paid",
  "Add new team members in minutes as you grow",
];

export function SoloVsTeam() {
  return (
    <Section className="relative">
      <div className="absolute inset-x-0 bottom-0 -z-10 h-96 bg-gradient-to-t from-brand-50/60 to-transparent" />
      <SectionHeading
        eyebrow="Solo or team"
        title="Works when it's just you. Scales when it's not."
        subtitle="Start as a one-person operation and grow into a coordinated team — without switching tools halfway."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal>
          <div className="h-full rounded-3xl bg-white p-8 shadow-soft ring-1 ring-ink-100">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                <User className="size-6" aria-hidden />
              </span>
              <div>
                <h3 className="text-lg font-bold text-ink-950">Solo operators</h3>
                <p className="text-sm text-ink-500">You&apos;re the owner, the scheduler, and the crew</p>
              </div>
            </div>
            <ul className="space-y-3">
              {solo.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-ink-700">
                  <Check className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="relative h-full overflow-hidden rounded-3xl bg-ink-950 p-8 text-white shadow-lift ring-1 ring-ink-900">
            <div className="absolute -right-20 -top-20 size-64 rounded-full bg-brand-500/15 blur-2xl" />
            <div className="mb-5 flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-500/20 text-brand-300 ring-1 ring-brand-500/30">
                <Users className="size-6" aria-hidden />
              </span>
              <div>
                <h3 className="text-lg font-bold">Growing teams</h3>
                <p className="text-sm text-ink-300">2 to 50+ people in the field</p>
              </div>
            </div>
            <ul className="space-y-3">
              {team.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-ink-100">
                  <Check className="mt-0.5 size-4 shrink-0 text-brand-400" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
      <div className="mt-10 text-center">
        <PrimaryCTA />
      </div>
    </Section>
  );
}
