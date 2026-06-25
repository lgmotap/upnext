"use client";

import { useState } from "react";
import type { PortalFaqItem } from "@/lib/portal/faq";

export function PortalFaqAccordion({ items }: { items: PortalFaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-ink-100">
      <h3 className="text-sm font-bold text-ink-950">Common questions</h3>
      <ul className="mt-3 divide-y divide-ink-100">
        {items.map((item, index) => {
          const open = openIndex === index;
          return (
            <li key={item.question}>
              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : index)}
                className="flex w-full items-start justify-between gap-3 py-3 text-left"
                aria-expanded={open}
              >
                <span className="text-sm font-semibold text-ink-900">{item.question}</span>
                <span className="text-xs font-bold text-ink-400">{open ? "−" : "+"}</span>
              </button>
              {open && <p className="pb-3 text-sm leading-relaxed text-ink-600">{item.answer}</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
