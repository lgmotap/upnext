"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/Section";

const faqs = [
  {
    q: "Who is this for?",
    a: "Local service businesses that want a simpler way to manage bookings, customers, jobs, schedules, payments, and follow-ups — without juggling five different tools.",
  },
  {
    q: "Is this only for cleaning companies?",
    a: "No. Cleaning is one of the main use cases, but the platform is also being designed for lawn care, handyman services, painting, pet walking, pressure washing, car wash services, roofing, and other local service businesses.",
  },
  {
    q: "Is the product available now?",
    a: "Not yet. We're currently accepting early access requests before the public launch. Waitlist members get access first.",
  },
  {
    q: "What do early users get?",
    a: "Early users get first access before public launch, behind-the-scenes product updates, a direct line to shape what we build, and exclusive launch offers.",
  },
  {
    q: "Do I need a big team to use it?",
    a: "No. The platform works for solo operators, small teams, and growing service businesses. Start alone and add team members whenever you're ready.",
  },
  {
    q: "Will this replace my spreadsheet?",
    a: "Yes — that's the goal. The platform is designed to replace messy spreadsheets, scattered notes, and manual tracking with one organized workspace.",
  },
  {
    q: "Does joining the waitlist cost anything?",
    a: "No. Joining the waitlist is free and there's no commitment. We'll simply contact you before public launch with early access details.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Section id="faq" className="bg-white">
      <SectionHeading
        eyebrow="FAQ"
        title="Questions before joining?"
        subtitle="Everything you need to know about early access."
      />
      <div className="mx-auto max-w-3xl space-y-3">
        {faqs.map((f, i) => {
          const isOpen = open === i;
          return (
            <div
              key={f.q}
              className={`rounded-2xl ring-1 transition ${
                isOpen ? "bg-brand-50/60 ring-brand-200" : "bg-ink-50/50 ring-ink-100"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="font-bold text-ink-950">{f.q}</span>
                <ChevronDown
                  className={`size-5 shrink-0 text-brand-600 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
              {isOpen && (
                <p className="px-6 pb-5 text-sm leading-relaxed text-ink-600">{f.a}</p>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}
