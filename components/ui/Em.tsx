/**
 * Italic emphasis inside a headline — accent color + weight (Inter per brand sheet).
 */
export function Em({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <em className={`font-sans font-extrabold italic tracking-normal ${className}`}>
      {children}
    </em>
  );
}
