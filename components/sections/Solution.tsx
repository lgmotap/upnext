import {
  Globe,
  Users,
  CalendarCheck,
  CalendarRange,
  FileText,
  Wallet,
  MessageSquareText,
  LayoutDashboard,
} from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

const features = [
  {
    icon: Globe,
    title: "Online booking requests",
    text: "Let customers request services and keep every request organized from the start.",
  },
  {
    icon: Users,
    title: "Customer CRM",
    text: "Store customer details, job history, notes, preferences, and communication in one place.",
  },
  {
    icon: CalendarCheck,
    title: "Job scheduling",
    text: "Plan jobs, assign team members, and track daily work without calendar chaos.",
  },
  {
    icon: CalendarRange,
    title: "Team calendar",
    text: "See who's available, who's assigned, and what needs to happen next.",
  },
  {
    icon: FileText,
    title: "Quotes & invoices",
    text: "Create professional quotes and keep invoice tracking connected to each customer.",
  },
  {
    icon: Wallet,
    title: "Payment tracking",
    text: "Know which jobs are paid, pending, overdue, or ready to follow up.",
  },
  {
    icon: MessageSquareText,
    title: "Automated follow-ups",
    text: "Reduce manual chasing with reminders and customer follow-up workflows.",
  },
  {
    icon: LayoutDashboard,
    title: "Business dashboard",
    text: "Get a clear view of upcoming jobs, revenue, customers, and team activity.",
  },
];

export function Solution() {
  return (
    <Section id="features" className="relative">
      <div className="absolute inset-x-0 top-0 -z-10 h-96 bg-gradient-to-b from-brand-50/60 to-transparent" />
      <SectionHeading
        eyebrow="The solution"
        title="Everything you need to get booked and run the work"
        subtitle="Online booking plus the tools to manage every job behind it — for service businesses that want less admin and more control."
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(({ icon: Icon, title, text }, i) => (
          <Reveal key={title} delay={(i % 4) * 0.06}>
            <SpotlightCard className="group h-full rounded-2xl bg-white p-6 shadow-soft ring-1 ring-ink-100 hover:shadow-lift hover:ring-brand-200">
              <span className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700 ring-1 ring-brand-200/60 transition-all duration-300 group-hover:from-brand-500 group-hover:to-brand-700 group-hover:text-white group-hover:-rotate-6 group-hover:scale-110">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mb-1.5 font-bold text-ink-950">{title}</h3>
              <p className="text-sm leading-relaxed text-ink-600">{text}</p>
            </SpotlightCard>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
