import { ChevronDown } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/Section";
import { faqs } from "@/lib/config";

/** SSR FAQ — all answers in initial HTML for crawlers and assistive tech. */
export function FAQ() {
  return (
    <Section id="faq" className="bg-white" labelledBy="faq-title">
      <SectionHeading
        headingId="faq-title"
        eyebrow="FAQ"
        title="Questions before joining?"
        subtitle="Everything you need to know about early access."
      />
      <div className="mx-auto max-w-3xl space-y-3">
        {faqs.map((f) => (
          <details
            key={f.q}
            className="group rounded-2xl bg-ink-50/50 ring-1 ring-ink-100 open:bg-brand-50/60 open:ring-brand-200"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-left marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="font-bold text-ink-950">{f.q}</span>
              <ChevronDown
                className="size-5 shrink-0 text-brand-600 transition-transform group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <p className="px-6 pb-5 text-sm leading-relaxed text-ink-600">{f.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
