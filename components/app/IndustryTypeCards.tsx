"use client";

import { serviceTypes } from "@/lib/config";
import { industryIconKey } from "@/lib/onboarding/industry-cards";
import { ServiceIcon } from "@/components/booking/ServiceIcon";

type Props = {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  disabled?: boolean;
};

export function IndustryTypeCards({ value, onChange, name = "businessType", disabled = false }: Props) {
  return (
    <div>
      <input type="hidden" name={name} value={value} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {serviceTypes.map((type) => {
          const selected = value === type;
          return (
            <button
              key={type}
              type="button"
              disabled={disabled}
              onClick={() => onChange(type)}
              aria-pressed={selected}
              className={`flex flex-col items-center gap-2 rounded-xl px-3 py-3 text-center text-xs font-semibold transition ring-1 sm:text-sm ${
                selected
                  ? "bg-brand-50 text-brand-950 ring-brand-400 shadow-sm"
                  : "bg-white text-ink-700 ring-ink-200 hover:ring-brand-300"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <span
                className={`flex size-9 items-center justify-center rounded-lg ring-1 ${
                  selected ? "bg-brand-100 text-brand-700 ring-brand-200" : "bg-ink-50 text-brand-600 ring-ink-100"
                }`}
              >
                <ServiceIcon iconKey={industryIconKey(type)} className="size-4" />
              </span>
              <span className="leading-snug">{type}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
