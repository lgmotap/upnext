/**
 * A hand-written marker note with a little curved arrow — used to point at
 * UI like a person annotating a screenshot. Decorative only.
 */

type Direction = "down-left" | "down-right" | "up-right" | "left";

const arrows: Record<Direction, React.ReactNode> = {
  "down-left": (
    <path d="M40 4 C 20 8, 8 20, 6 40 M6 40 l10 -6 M6 40 l3 -11" />
  ),
  "down-right": (
    <path d="M8 4 C 28 8, 40 20, 42 40 M42 40 l-10 -6 M42 40 l-3 -11" />
  ),
  "up-right": (
    <path d="M6 40 C 26 36, 38 24, 42 6 M42 6 l-11 3 M42 6 l-6 10" />
  ),
  left: (
    <path d="M44 22 C 28 18, 14 18, 6 22 M6 22 l11 -6 M6 22 l11 6" />
  ),
};

export function HandNote({
  children,
  direction = "down-left",
  rotate = "-5deg",
  className = "",
  arrowClassName = "",
}: {
  children: React.ReactNode;
  direction?: Direction;
  rotate?: string;
  className?: string;
  arrowClassName?: string;
}) {
  return (
    <div
      className={`pointer-events-none select-none ${className}`}
      style={{ transform: `rotate(${rotate})` }}
      aria-hidden
    >
      <p className="font-hand text-[1.35rem] font-bold leading-tight text-brand-600">{children}</p>
      <svg
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`text-brand-500 ${arrowClassName}`}
      >
        {arrows[direction]}
      </svg>
    </div>
  );
}
