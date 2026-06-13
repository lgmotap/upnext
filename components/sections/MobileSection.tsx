import { Smartphone, ListChecks, StickyNote, Send, MapPin } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { MobileMockup } from "@/components/mockups/MobileMockup";
import { Sparkle, Checklist3D } from "@/components/three-d/Objects";

const points = [
  {
    icon: ListChecks,
    title: "Today's jobs, in order",
    text: "Every team member sees exactly where to be, when, and what the job includes.",
  },
  {
    icon: StickyNote,
    title: "Notes & customer preferences",
    text: "Gate codes, pets, parking, special requests — all attached to the job, not buried in chat.",
  },
  {
    icon: MapPin,
    title: "Addresses one tap away",
    text: "Open directions straight from the job card. No copy-pasting from messages.",
  },
  {
    icon: Send,
    title: "Finish the job, wow the customer",
    text: "Mark complete and your customer is automatically sent a tidy summary — checklist done, before & after photos, and a receipt.",
  },
];

export function MobileSection() {
  return (
    <Section className="bg-white">
      <div className="grid items-center gap-14 lg:grid-cols-2">
        <Reveal className="relative mx-auto order-last lg:order-first">
          <MobileMockup className="mx-auto" />
          <Sparkle className="animate-float absolute -left-8 top-8 w-12 [--tilt:10deg]" />
          <Checklist3D className="animate-float-delayed absolute -right-10 bottom-10 w-20 [--tilt:8deg]" />
          <div className="absolute -z-10 inset-8 rounded-full bg-brand-100/70 blur-3xl" />
        </Reveal>
        <div>
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-100 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-800">
            <Smartphone className="size-3.5" /> For you or your crew
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-ink-950 sm:text-4xl text-balance">
            Everything you need for the day — right on your phone
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-600">
            Whether it&apos;s just you or a whole crew, no more morning group chats, screenshots of
            addresses, or &quot;wait, which house was it?&quot; See the day clearly, get on with the
            work, and keep customers in the loop automatically.
          </p>
          <ul className="mt-8 space-y-5">
            {points.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-bold text-ink-950">{title}</h3>
                  <p className="text-sm leading-relaxed text-ink-600">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
