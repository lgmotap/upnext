import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cta } from "@/lib/config";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent-500 text-white shadow-[0_8px_24px_rgba(255,107,94,0.4)] hover:bg-accent-600 hover:shadow-[0_12px_30px_rgba(255,107,94,0.5)] hover:-translate-y-0.5",
  secondary:
    "bg-white text-ink-900 ring-1 ring-ink-200 shadow-soft hover:ring-brand-300 hover:text-brand-700",
  ghost: "text-brand-700 hover:text-brand-800 hover:bg-brand-50",
};

const sizes: Record<Size, string> = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

export function CTAButton({
  variant = "primary",
  size = "md",
  href = cta.primary.href,
  withArrow = false,
  className = "",
  children,
}: {
  variant?: Variant;
  size?: Size;
  href?: string;
  withArrow?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
      {withArrow && <ArrowRight className="size-4" aria-hidden />}
    </Link>
  );
}

/** The page-wide primary CTA. Reads label + target from lib/config.ts. */
export function PrimaryCTA({
  size = "lg",
  compact = false,
  className = "",
}: {
  size?: Size;
  compact?: boolean;
  className?: string;
}) {
  const c = compact ? cta.compact : cta.primary;
  return (
    <CTAButton variant="primary" size={size} href={c.href} withArrow className={className}>
      {c.label}
    </CTAButton>
  );
}
