import {
  Sparkles,
  Leaf,
  Droplets,
  Wrench,
  Paintbrush,
  PawPrint,
  Car,
  Home,
} from "lucide-react";

const industries = [
  { icon: Sparkles, label: "Cleaning" },
  { icon: Leaf, label: "Lawn Care" },
  { icon: Droplets, label: "Pressure Washing" },
  { icon: Wrench, label: "Handyman" },
  { icon: Paintbrush, label: "Painting" },
  { icon: PawPrint, label: "Pet Walking" },
  { icon: Car, label: "Car Wash" },
  { icon: Home, label: "Roofing" },
];

export function IndustryStrip() {
  return (
    <section className="border-y border-ink-100 bg-white py-10">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <p className="mb-6 text-center text-sm font-medium text-ink-500 text-pretty">
          Built for local service businesses that want to save time, look professional, and grow
          faster
        </p>
        <ul className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
          {industries.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="inline-flex items-center gap-2 rounded-full bg-ink-50 px-4 py-2 text-sm font-semibold text-ink-700 ring-1 ring-ink-100 transition hover:bg-brand-50 hover:text-brand-800 hover:ring-brand-200"
            >
              <Icon className="size-4 text-brand-600" aria-hidden />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
