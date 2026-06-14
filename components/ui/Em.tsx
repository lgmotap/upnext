/**
 * Italic-serif emphasis word inside a grotesk headline — the Pluto-style
 * accent (e.g. "Start for <Em>Free</Em>"). Color is inherited unless overridden.
 */
export function Em({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <em className={`font-serif font-normal italic tracking-normal ${className}`}>{children}</em>;
}
