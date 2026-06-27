export function Section({
  id,
  className = "",
  labelledBy,
  children,
}: {
  id?: string;
  className?: string;
  /** ID of the section's primary heading (`SectionHeading` `headingId`). */
  labelledBy?: string;
  children: React.ReactNode;
}) {
  return (
    <article id={id} aria-labelledby={labelledBy} className={`scroll-mt-24 py-20 sm:py-28 ${className}`}>
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">{children}</div>
    </article>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  headingId,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
  align?: "center" | "left";
  /** Tie section landmark to its primary heading for assistive tech / GEO parsers. */
  headingId?: string;
}) {
  const alignCls = align === "center" ? "mx-auto text-center" : "text-left";
  return (
    <div className={`max-w-3xl ${alignCls} mb-12 sm:mb-16`}>
      {eyebrow && (
        <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-700 ring-1 ring-brand-100">
          <span className="size-1.5 rounded-full bg-brand-500" />
          {eyebrow}
        </p>
      )}
      <h2
        id={headingId}
        className="text-3xl font-bold tracking-tight text-ink-950 sm:text-[2.7rem] sm:leading-[1.1] text-balance"
      >
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-lg leading-relaxed text-ink-600 text-pretty">{subtitle}</p>
      )}
    </div>
  );
}
