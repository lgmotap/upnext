import { Section, SectionHeading } from "@/components/ui/Section";
import { CompareSlider } from "@/components/ui/CompareSlider";
import { Reveal } from "@/components/ui/Reveal";
import { SpreadsheetMock } from "@/components/mockups/BeforeAfterMocks";
import { DashboardMockup } from "@/components/mockups/DashboardMockup";

export function BeforeAfter() {
  return (
    <Section id="before-after">
      <SectionHeading
        eyebrow="The transformation"
        title="From messy spreadsheets to one simple system"
        subtitle="Replace scattered job lists, customer notes, payment tracking, and manual follow-ups with one clean workspace built for service businesses."
      />
      <Reveal>
        <CompareSlider
          beforeLabel="Before: Manual tracking"
          afterLabel="After: Managed in one platform"
          before={<SpreadsheetMock className="mx-auto max-w-3xl" />}
          after={<DashboardMockup className="mx-auto max-w-3xl" />}
        />
        <div className="mx-auto mt-6 grid max-w-3xl gap-3 text-center text-sm sm:grid-cols-2 sm:text-left">
          <p className="rounded-xl bg-white px-4 py-3 text-ink-600 ring-1 ring-ink-100">
            <span className="font-bold text-ink-900">Before:</span> spreadsheets, notes, messages,
            and payment tracking all in different places.
          </p>
          <p className="rounded-xl bg-brand-50 px-4 py-3 text-brand-900 ring-1 ring-brand-200/60">
            <span className="font-bold">After:</span> every job, customer, payment, and follow-up
            organized in one place.
          </p>
        </div>
        <p className="mt-4 text-center text-xs font-medium text-ink-400">
          Drag the handle to compare
        </p>
      </Reveal>
    </Section>
  );
}
