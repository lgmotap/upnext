"use client";

import { useRef } from "react";

/**
 * Card wrapper with a pointer-tracked radial "spotlight" highlight plus a
 * subtle lift on hover. The spotlight position is written to CSS custom
 * properties on pointermove so there's no React re-render per frame.
 * Honors prefers-reduced-motion (the spotlight layer is hidden via CSS).
 */
export function SpotlightCard({
  as: Tag = "div",
  className = "",
  spotlightClassName = "",
  children,
  ...rest
}: {
  as?: React.ElementType;
  className?: string;
  spotlightClassName?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  const ref = useRef<HTMLElement>(null);

  const onPointerMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  return (
    <Tag
      ref={ref}
      onPointerMove={onPointerMove}
      className={`spotlight-card group/spot relative isolate overflow-hidden transition-all duration-300 hover:-translate-y-1 ${className}`}
      {...rest}
    >
      <span
        aria-hidden
        className={`spotlight-card__glow pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100 ${spotlightClassName}`}
      />
      {children}
    </Tag>
  );
}
