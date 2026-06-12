import { Section, SectionHeading } from "@/components/ui/Section";
import { CompareSlider } from "@/components/ui/CompareSlider";
import { Reveal } from "@/components/ui/Reveal";
import { MessyCalendarMock, CleanCalendarMock } from "@/components/mockups/BeforeAfterMocks";

export function CalendarCompare() {
  return (
    <Section className="bg-white">
      <SectionHeading
        eyebrow="Scheduling"
        title="From scheduling chaos to a clear team calendar"
        subtitle="See every booking, job, team member, and open time slot without guessing or switching between tools."
      />
      <Reveal>
        <CompareSlider
          beforeLabel="Before: Manual scheduling"
          afterLabel="After: Organized team calendar"
          before={<MessyCalendarMock className="mx-auto max-w-3xl" />}
          after={<CleanCalendarMock className="mx-auto max-w-3xl" />}
        />
        <div className="mx-auto mt-6 grid max-w-3xl gap-3 text-center text-sm sm:grid-cols-2 sm:text-left">
          <p className="rounded-xl bg-ink-50 px-4 py-3 text-ink-600 ring-1 ring-ink-100">
            <span className="font-bold text-ink-900">Before:</span> bookings, team availability,
            and job changes are hard to coordinate manually.
          </p>
          <p className="rounded-xl bg-brand-50 px-4 py-3 text-brand-900 ring-1 ring-brand-200/60">
            <span className="font-bold">After:</span> a clean schedule that shows what's booked,
            who's assigned, and what needs attention.
          </p>
        </div>
      </Reveal>
    </Section>
  );
}
