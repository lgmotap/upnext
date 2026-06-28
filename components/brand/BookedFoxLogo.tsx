import Image from "next/image";
import Link from "next/link";

type Theme = "light" | "dark" | "footer";

function Wordmark({ theme }: { theme: Theme }) {
  return (
    <span className="text-lg font-extrabold tracking-tight sm:text-xl">
      <span className={theme === "dark" ? "text-white" : "text-brand-950"}>Booked</span>
      <span className="text-brand-400">Fox</span>
    </span>
  );
}

/**
 * BookedFox logo lockups.
 * - `light`: transparent horizontal PNG (header on white/soft bg).
 * - `dark`: transparent icon + split-color wordmark (navy surfaces).
 * - `footer`: white horizontal PNG (navy surfaces — matches marketing footer).
 */
export function BookedFoxLogo({
  href = "/",
  theme = "light",
  className = "",
  priority = false,
  asLink = true,
  iconOnly = false,
  compact = false,
}: {
  href?: string;
  theme?: Theme;
  className?: string;
  priority?: boolean;
  asLink?: boolean;
  iconOnly?: boolean;
  compact?: boolean;
}) {
  const imageSize = compact ? "h-7 w-auto shrink-0 sm:h-8" : "h-8 w-auto shrink-0 sm:h-9";
  const content =
    (theme === "light" || theme === "footer") && !iconOnly ? (
      <Image
        src={theme === "footer" ? "/brand/logo-footer.png" : "/brand/logo-horizontal.png"}
        alt="BookedFox"
        width={1024}
        height={theme === "footer" ? 188 : 218}
        className={`${imageSize} ${className}`}
        priority={priority}
      />
    ) : (
      <span className={`inline-flex items-center gap-2.5 ${className}`}>
        <Image
          src="/brand/icon.png"
          alt=""
          width={32}
          height={32}
          className="size-8 shrink-0 sm:size-9"
          priority={priority}
        />
        {!iconOnly && <Wordmark theme={theme} />}
      </span>
    );

  if (!asLink) {
    return content;
  }

  return (
    <Link href={href} className="inline-flex items-center" aria-label="BookedFox home">
      {content}
    </Link>
  );
}
