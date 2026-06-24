import Link from "next/link";
import { Clock } from "lucide-react";
import { ServiceIcon } from "@/components/booking/ServiceIcon";
import { formatMoney } from "@/lib/money/format";

type PublicServiceCardProps = {
  name: string;
  description?: string | null;
  durationMinutes: number;
  basePriceCents: number;
  currency: string;
  iconKey?: string | null;
  isAddon?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  href?: string;
};

export function PublicServiceCard({
  name,
  description,
  durationMinutes,
  basePriceCents,
  currency,
  iconKey,
  isAddon = false,
  selected = false,
  onSelect,
  href,
}: PublicServiceCardProps) {
  const body = (
    <>
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
          selected ? "bg-brand-200 text-brand-900" : "bg-brand-50 text-brand-700"
        }`}
      >
        <ServiceIcon iconKey={iconKey} isAddon={isAddon} className="size-5" />
      </span>
      <div className="min-w-0 flex-1 pr-3">
        <p className="font-semibold text-ink-950">{name}</p>
        {description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-ink-500">{description}</p>
        )}
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-ink-500">
          <Clock className="size-3" /> {durationMinutes} min
        </p>
      </div>
      <span className="shrink-0 text-sm font-bold text-ink-950">
        {formatMoney(basePriceCents, currency)}
      </span>
    </>
  );

  const className = `flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
    selected
      ? "border-brand-400 bg-brand-50 ring-1 ring-brand-400"
      : "border-ink-200 bg-white hover:border-brand-300"
  }`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onSelect} className={`w-full ${className}`}>
      {body}
    </button>
  );
}
