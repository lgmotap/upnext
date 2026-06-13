import { Settings2, Inbox, CalendarCheck, TrendingUp } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { PrimaryCTA } from "@/components/ui/CTAButton";

const steps = [
  {
    icon: Settings2,
    title: "Set up your services",
    text: "Add your services, prices, availability, business details, and team members.",
  },
  {
    icon: Inbox,
    title: "Take booking requests",
    text: "Customers request services online, and every request lands organized in your dashboard.",
  },
  {
    icon: CalendarCheck,
    title: "Manage jobs & teams",
    text: "Schedule work, assign your team, track payments, and keep every job moving.",
  },
  {
    icon: TrendingUp,
    title: "Grow with less admin",
    text: "Follow up faster, reduce mistakes, and give customers a more professional experience.",
  },
];

export function HowItWorks() {
  return (
    <Section id="how-it-works">
      <SectionHeading
        eyebrow="How it works"
        title="A simpler way to run your service business"
        subtitle="From setup to your first organized week — in four steps, not four months."
      />
      <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(({ icon: Icon, title, text }, i) => (
          <Reveal key={title} delay={i * 0.08}>
            <li className="group relative h-full rounded-2xl bg-white p-6 pt-8 shadow-soft ring-1 ring-ink-100 transition duration-300 hover:-translate-y-1 hover:shadow-lift hover:ring-brand-200">
              <span className="absolute -top-4 left-6 flex size-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white shadow-md transition-transform duration-300 group-hover:scale-110">
                {i + 1}
              </span>
              <span className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 transition-all duration-300 group-hover:-rotate-6 group-hover:bg-brand-600 group-hover:text-white">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mb-1.5 font-bold text-ink-950">{title}</h3>
              <p className="text-sm leading-relaxed text-ink-600">{text}</p>
            </li>
          </Reveal>
        ))}
      </ol>
      <div className="mt-12 text-center">
        <PrimaryCTA />
      </div>
    </Section>
  );
}
