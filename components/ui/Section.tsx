export function Section({
  id,
  className = "",
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`scroll-mt-24 py-20 sm:py-28 ${className}`}>
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  const alignCls = align === "center" ? "mx-auto text-center" : "text-left";
  return (
    <div className={`max-w-3xl ${alignCls} mb-12 sm:mb-16`}>
      {eyebrow && (
        <p className="mb-4 inline-flex -rotate-2 items-center gap-1.5 rounded-xl bg-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-700 ring-1 ring-ink-200 shadow-soft">
          <span className="size-1.5 rounded-full bg-accent-500" />
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl font-bold tracking-tight text-ink-950 sm:text-4xl text-balance">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-lg leading-relaxed text-ink-600 text-pretty">{subtitle}</p>
      )}
    </div>
  );
}
