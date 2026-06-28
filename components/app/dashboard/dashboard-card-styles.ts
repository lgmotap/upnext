/** Base shell for all dashboard cards. */
export const dashboardCardClass =
  "rounded-[18px] border border-[#E6EAF0] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]";

/** Section cards (schedule, activity, performance). */
export const dashboardSectionCardClass = `${dashboardCardClass} overflow-hidden`;

/** Mini metric tiles inside performance overview. */
export const dashboardMiniMetricCardClass =
  "rounded-[14px] border border-[#E6EAF0] bg-white p-3.5";

/** Compact top KPI cards. */
export const dashboardKpiCardClass = `${dashboardCardClass} p-[18px]`;

/** Shared dashboard typography scale. */
export const dashboardType = {
  pageTitle: "text-2xl font-semibold tracking-tight text-[#0B1F3A]",
  pageSubtitle: "text-sm text-[#7B8494]",
  cardTitle: "text-sm font-semibold text-[#0B1F3A]",
  sectionLabel: "text-xs font-semibold uppercase tracking-wide text-[#7B8494]",
  kpiLabel: "text-xs font-medium text-[#7B8494]",
  kpiValue: "text-xl font-semibold leading-none text-[#0B1F3A]",
  kpiSubtext: "text-xs font-medium text-[#526071]",
  metricLabel: "text-xs font-medium text-[#7B8494]",
  metricValue: "text-lg font-semibold leading-none text-[#0B1F3A]",
  revenueTotal: "text-2xl font-semibold leading-none tracking-tight text-[#0B1F3A]",
  revenueDelta: "text-xs font-semibold",
  revenueCompare: "text-xs font-medium text-[#7B8494]",
  body: "text-sm text-[#7B8494]",
  rowTitle: "text-sm font-semibold text-[#0B1F3A]",
  rowMeta: "text-xs text-[#7B8494]",
  tableHeader: "text-[11px] font-semibold uppercase tracking-wide text-[#7B8494]",
  footnote: "text-xs font-medium text-[#7B8494]",
  link: "text-sm font-medium text-[#2563EB]",
} as const;
