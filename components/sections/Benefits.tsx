import { Clock3, BellRing, BadgeCheck, Eye, Rocket, HeartHandshake } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { Em } from "@/components/ui/Em";

const benefits = [
  {
    icon: Clock3,
    title: "Save hours every week",
    text: "Reduce repetitive admin work and keep daily operations easier to manage.",
  },
  {
    icon: BellRing,
    title: "Never miss a job or follow-up",
    text: "Keep requests, reminders, and customer communication organized automatically.",
  },
  {
    icon: BadgeCheck,
    title: "Look more professional",
    text: "Give customers a smoother experience from booking to payment.",
  },
  {
    icon: Eye,
    title: "Know what's happening",
    text: "See jobs, customers, teams, and payments clearly from one dashboard.",
  },
  {
    icon: HeartHandshake,
    title: "Keep customers coming back",
    text: "Job history, preferences, and timely follow-ups make repeat business easy.",
  },
  {
    icon: Rocket,
    title: "Grow without the growing pains",
    text: "Start solo and add team members, services, and bookings as you scale.",
  },
];

export function Benefits() {
  return (
    <Section className="bg-white">
      <SectionHeading
        eyebrow="Why it matters"
        title={<>Less admin. More <Em className="text-brand-700">control</Em>. A better customer experience.</>}
        subtitle="Built so the day-to-day of running a service business stops eating your evenings."
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {benefits.map(({ icon: Icon, title, text }, i) => (
          <Reveal key={title} delay={(i % 3) * 0.07}>
            <SpotlightCard className="group flex h-full gap-4 rounded-3xl bg-brand-50/60 p-6 ring-1 ring-brand-100 hover:shadow-soft hover:ring-brand-200">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-400 text-brand-950 shadow-sm transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <h3 className="mb-1 font-bold text-ink-950">{title}</h3>
                <p className="text-sm leading-relaxed text-ink-600">{text}</p>
              </div>
            </SpotlightCard>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
