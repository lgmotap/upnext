import { minutesToHm, parseHmToMinutes } from "@/lib/datetime/timezone";

export type WeeklyRule = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

/** Intersect org hours with worker hours. Empty worker rules = use org hours only. */
export function intersectWeeklyRules(orgRules: WeeklyRule[], memberRules: WeeklyRule[]): WeeklyRule[] {
  if (memberRules.length === 0) return orgRules;

  const memberByDay = Object.fromEntries(memberRules.map((r) => [r.dayOfWeek, r]));

  return orgRules.map((org) => {
    const member = memberByDay[org.dayOfWeek];
    if (!org.isActive || !member?.isActive) {
      return { ...org, isActive: false };
    }

    const startMin = Math.max(parseHmToMinutes(org.startTime), parseHmToMinutes(member.startTime));
    const endMin = Math.min(parseHmToMinutes(org.endTime), parseHmToMinutes(member.endTime));

    if (startMin >= endMin) {
      return { ...org, isActive: false };
    }

    return {
      dayOfWeek: org.dayOfWeek,
      startTime: minutesToHm(startMin),
      endTime: minutesToHm(endMin),
      isActive: true,
    };
  });
}
