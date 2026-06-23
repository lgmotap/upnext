import Link from "next/link";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";

/** Surface card used across product screens. */
export function Card({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section";
}) {
  return (
    <Tag className={`rounded-2xl bg-white ring-1 ring-ink-100 shadow-soft ${className}`}>
      {children}
    </Tag>
  );
}

export function CardHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3.5">
      <h2 className="text-sm font-bold text-ink-950">{title}</h2>
      {action}
    </div>
  );
}

/** Page title block at the top of each product screen. */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-950 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  trend = "up",
  icon: Icon,
}: {
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down";
  icon?: LucideIcon;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink-500">{label}</p>
        {Icon && (
          <span className="flex size-8 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight text-ink-950">{value}</p>
      {delta && (
        <p
          className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold ${
            trend === "up" ? "text-brand-700" : "text-rose-600"
          }`}
        >
          {trend === "up" ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
          {delta}
        </p>
      )}
    </Card>
  );
}

/** Small primary button for product screens (clay/green CTA reuse). */
export function AppButton({
  children,
  href,
  variant = "primary",
  className = "",
}: {
  children: React.ReactNode;
  href?: string;
  variant?: "primary" | "ghost" | "outline";
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition";
  const variants = {
    primary: "bg-brand-400 text-brand-950 hover:bg-brand-300",
    ghost: "text-ink-600 hover:bg-ink-100 hover:text-ink-950",
    outline: "ring-1 ring-ink-200 text-ink-800 hover:ring-brand-400 hover:text-brand-700",
  };
  const cls = `${base} ${variants[variant]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return <button className={cls}>{children}</button>;
}

export function Avatar({ initials, className = "" }: { initials: string; className?: string }) {
  return (
    <span
      className={`flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800 ${className}`}
    >
      {initials}
    </span>
  );
}
