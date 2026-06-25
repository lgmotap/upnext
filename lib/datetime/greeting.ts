export type GreetingPeriod = "morning" | "afternoon" | "evening";

export function getGreetingPeriod(now: Date, timeZone: string): GreetingPeriod {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hour12: false }).format(now),
  );
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function formatGreetingTitle(period: GreetingPeriod, displayName: string): string {
  const word = period === "morning" ? "morning" : period === "afternoon" ? "afternoon" : "evening";
  return `Good ${word}, ${displayName}`;
}

export function formatGreetingSubtitle(userFirstName: string, dateLabel: string): string {
  return `Hi ${userFirstName} · ${dateLabel}`;
}
