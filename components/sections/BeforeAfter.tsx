import { Section, SectionHeading } from "@/components/ui/Section";
import { CompareSlider } from "@/components/ui/CompareSlider";
import { Reveal } from "@/components/ui/Reveal";
import { ManualTrackingMock, ManagedPlatformMock } from "@/components/mockups/BeforeAfterMocks";

export function BeforeAfter() {
  return (
    <Section id="before-after">
      <SectionHeading
        eyebrow="The transformation"
        title="From scattered texts, calls, and spreadsheets to one simple system"
        subtitle="Replace the spreadsheet, the unanswered texts, the missed calls, and the manual payment chasing with one workspace that schedules the work and handles the messages for you."
      />
      <Reveal>
        <CompareSlider
          beforeLabel="Before: Manual tracking"
          afterLabel="After: Managed in one platform"
          before={<ManualTrackingMock className="mx-auto max-w-3xl" />}
          after={<ManagedPlatformMock className="mx-auto max-w-3xl" />}
        />
        <div className="mx-auto mt-6 grid max-w-3xl gap-3 text-center text-sm sm:grid-cols-2 sm:text-left">
          <p className="rounded-xl bg-white px-4 py-3 text-ink-600 ring-1 ring-ink-100">
            <span className="font-bold text-ink-900">Before:</span> jobs in a spreadsheet,
            customers texting you, payments chased over missed calls and voicemails.
          </p>
          <p className="rounded-xl bg-brand-50 px-4 py-3 text-brand-900 ring-1 ring-brand-200/60">
            <span className="font-bold">After:</span> every job, payment, and customer
            conversation in one place — confirmations, reminders, and receipts send themselves.
          </p>
        </div>
        <p className="mt-4 text-center text-xs font-medium text-ink-400">
          Drag the handle to compare
        </p>
      </Reveal>
    </Section>
  );
}
