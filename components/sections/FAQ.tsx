"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/Section";
import { faqs } from "@/lib/config";

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
