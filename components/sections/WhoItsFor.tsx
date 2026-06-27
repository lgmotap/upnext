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
import { Em } from "@/components/ui/Em";

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
        title={<>Built for the businesses that keep <Em className="text-brand-700">local communities</Em> moving</>}
        subtitle="Whether you're working alone or managing a growing team, the platform is designed to help you stay organized and look professional."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {businesses.map(({ icon: Icon, title, text, photo, alt }, i) => (
          <Reveal key={title} delay={(i % 5) * 0.05}>
            <div className="group relative h-72 overflow-hidden rounded-3xl shadow-soft ring-1 ring-ink-100/60 transition duration-300 hover:-translate-y-1 hover:shadow-lift">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo}
                alt={alt}
                width={640}
                height={288}
                loading="lazy"
                className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/30 to-transparent" />
              <span className="absolute left-3 top-3 flex size-9 items-center justify-center rounded-full bg-brand-400 text-brand-950 shadow-md transition-transform duration-300 group-hover:scale-110">
                <Icon className="size-4.5" aria-hidden />
              </span>
              <div className="absolute inset-x-0 bottom-0 p-4">
                <h3 className="text-sm font-bold text-white">{title}</h3>
                <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-white/75">{text}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
