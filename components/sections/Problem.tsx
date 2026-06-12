import {
  FileSpreadsheet,
  BellOff,
  CalendarX2,
  CircleDollarSign,
  Frown,
} from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";

const problems = [
  {
    icon: FileSpreadsheet,
    title: "Messy job tracking",
    text: "Jobs are spread across spreadsheets, notes, messages, and memory.",
  },
  {
    icon: BellOff,
    title: "Missed follow-ups",
    text: "Leads, quotes, reminders, and customer updates are easy to forget.",
  },
  {
    icon: CalendarX2,
    title: "Scheduling confusion",
    text: "Team availability, customer bookings, and job changes are hard to coordinate manually.",
  },
  {
    icon: CircleDollarSign,
    title: "Payment uncertainty",
    text: "It's hard to know what's been paid, what's pending, and what needs attention.",
  },
  {
    icon: Frown,
    title: "Unprofessional customer experience",
    text: "Manual processes can make even a great business look less organized than it really is.",
  },
];

export function Problem() {
  return (
    <Section className="bg-white">
      <SectionHeading
        eyebrow="The problem"
        title="Stop running your business from five different places"
        subtitle="Most service businesses start with simple tools. But as bookings grow, the admin work becomes harder to manage."
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {problems.map(({ icon: Icon, title, text }, i) => (
          <Reveal key={title} delay={i * 0.06}>
            <div className="h-full rounded-2xl bg-ink-50/60 p-6 ring-1 ring-ink-100 transition hover:-translate-y-0.5 hover:shadow-soft">
              <span className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-white text-rose-500 shadow-soft ring-1 ring-ink-100">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mb-1.5 font-bold text-ink-950">{title}</h3>
              <p className="text-sm leading-relaxed text-ink-600">{text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
