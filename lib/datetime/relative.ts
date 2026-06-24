/** Human-readable relative time for activity feeds (e.g. "8 min ago"). */
export function formatRelativeTime(from: Date, now = new Date()): string {
  const diffMs = now.getTime() - from.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "Just now";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;

  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(from);
}
