import {
  Home,
  Building2,
  Layers,
  Leaf,
  Droplets,
  HardHat,
  Wrench,
  Paintbrush,
  PawPrint,
  Car,
} from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";

const img = (id: string) => `https://images.unsplash.com/${id}?w=640&q=60&auto=format&fit=crop`;

const businesses = [
  {
    icon: Home,
    title: "Residential Cleaning",
    text: "Manage recurring cleanings, customer preferences, team schedules, and follow-ups.",
    photo: img("photo-1581578731548-c64695cc6952"),
    alt: "A cleaner in gloves wiping down a window in a home",
  },
  {
    icon: Building2,
    title: "Commercial Cleaning",
    text: "Track contracts, site visits, staff assignments, and regular service schedules.",
    photo: img("photo-1603712725038-e9334ae8f39f"),
    alt: "A cleaner mopping the floor of a commercial building lobby",
  },
  {
    icon: Layers,
    title: "Carpet Cleaning",
    text: "Organize bookings, job details, customer history, and payment status.",
    photo: img("photo-1527515637462-cff94eecc1ac"),
    alt: "A person vacuuming confetti out of a carpet",
  },
  {
    icon: Leaf,
    title: "Lawn Care",
    text: "Plan recurring outdoor jobs, team routes, and seasonal service requests.",
    photo: img("photo-1589923188900-85dae523342b"),
    alt: "A gardener tending plants in an outdoor bed",
  },
  {
    icon: Droplets,
    title: "Pressure Washing",
    text: "Handle quotes, one-time jobs, customer details, and follow-up reminders.",
    photo: img("photo-1635424710928-0544e8512eae"),
    alt: "A worker washing a roof with a hose",
  },
  {
    icon: HardHat,
    title: "Roofing Services",
    text: "Track leads, inspections, quotes, job stages, and customer communication.",
    photo: img("photo-1632759145351-1d592919f522"),
    alt: "A roofer standing on the roof of a brick house",
  },
  {
    icon: Wrench,
    title: "Handyman Services",
    text: "Keep small jobs, customer notes, quotes, and schedules organized.",
    photo: img("photo-1621905251189-08b45d6a269e"),
    alt: "A handyman in a hard hat drilling into a wall",
  },
  {
    icon: Paintbrush,
    title: "Painting",
    text: "Manage project requests, estimates, job progress, and customer follow-ups.",
    photo: img("photo-1562259949-e8e7689d7828"),
    alt: "A paint roller rolling fresh blue paint onto a wall",
  },
  {
    icon: PawPrint,
    title: "Pet Walking",
    text: "Schedule recurring visits, customer preferences, and daily service notes.",
    photo: img("photo-1494947665470-20322015e3a8"),
    alt: "A dog walker holding the leashes of three dogs in a park",
  },
  {
    icon: Car,
    title: "Car Wash",
    text: "Manage bookings, mobile jobs, customer records, and payment tracking.",
    photo: img("photo-1607860108855-64acf2078ed9"),
    alt: "A person hand-washing a foam-covered car",
  },
];

export function WhoItsFor() {
  return (
    <Section id="who-its-for">
      <SectionHeading
        eyebrow="Who it's for"
        title="Built for the businesses that keep local communities moving"
        subtitle="Whether you're working alone or managing a growing team, the platform is designed to help you stay organized and look professional."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {businesses.map(({ icon: Icon, title, text, photo, alt }, i) => (
          <Reveal key={title} delay={(i % 5) * 0.05}>
            <div className="group h-full overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-ink-100 transition hover:-translate-y-0.5 hover:shadow-lift hover:ring-brand-200">
              <div className="relative h-32 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo}
                  alt={alt}
                  loading="lazy"
                  className="size-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute bottom-2 left-2 flex size-9 items-center justify-center rounded-xl bg-white/95 text-brand-700 shadow-md">
                  <Icon className="size-4.5" aria-hidden />
                </span>
              </div>
              <div className="p-4">
                <h3 className="mb-1 text-sm font-bold text-ink-950">{title}</h3>
                <p className="text-[13px] leading-relaxed text-ink-600">{text}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
