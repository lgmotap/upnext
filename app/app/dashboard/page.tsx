import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GettingStartedChecklist } from "@/components/app/GettingStartedChecklist";
import { TopKpiGrid } from "@/components/app/dashboard/TopKpiGrid";
import { PerformanceSection } from "@/components/app/dashboard/PerformanceSection";
import { OperationsSection } from "@/components/app/dashboard/OperationsSection";
import { getAppSession } from "@/server/permissions/session";
import { getBookingPageUrl } from "@/lib/url/app";
import { getDashboardData } from "@/server/services/dashboard";
import { getGettingStartedTasks } from "@/server/services/getting-started";
import {
  dashboardRangePresets,
  parseDashboardPerformanceRange,
  parseDashboardRevenueRange,
} from "@/lib/reporting/dashboard-performance.shared";
import { dashboardType } from "@/components/app/dashboard/dashboard-card-styles";
import { prisma } from "@/lib/db/prisma";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    revenueFrom?: string;
    revenueTo?: string;
    error?: string;
  }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/sign-in?next=/app/dashboard");

  const params = await searchParams;
  const org = await prisma.organization.findUnique({
    where: { id: session.organizationId },
    select: {
      name: true,
      timezone: true,
      currency: true,
      businessProfile: { select: { publicSlug: true, displayName: true } },
    },
  });
  const timeZone = org?.timezone ?? "America/New_York";
  const currency = org?.currency ?? "USD";
  const slug = org?.businessProfile?.publicSlug ?? "";
  const bookingUrl = slug ? getBookingPageUrl(slug) : "";

  const gettingStarted = await getGettingStartedTasks(
    session.organizationId,
    bookingUrl || "Set up your booking page in Settings",
  );

  const data = await getDashboardData(
    session.organizationId,
    timeZone,
    currency,
    session.name ?? session.email.split("@")[0],
    org?.businessProfile?.displayName ?? org?.name ?? "your business",
    gettingStarted.percent,
  );

  const perfRangeParsed = parseDashboardPerformanceRange(params.from, params.to, timeZone);
  const revenueRangeParsed = parseDashboardRevenueRange(
    params.revenueFrom,
    params.revenueTo,
    timeZone,
  );
  const rangeError =
    !perfRangeParsed.ok
      ? perfRangeParsed.error
      : !revenueRangeParsed.ok
        ? revenueRangeParsed.error
        : params.error;

  let performanceOverview = null;
  let revenuePerformance = null;
  let performanceError: string | null = null;

  if (data.showPerformance && perfRangeParsed.ok && revenueRangeParsed.ok) {
    try {
      const { getDashboardPerformance } = await import("@/lib/reporting/dashboard-performance");
      [performanceOverview, revenuePerformance] = await Promise.all([
        getDashboardPerformance(session.organizationId, timeZone, perfRangeParsed.range),
        getDashboardPerformance(session.organizationId, timeZone, revenueRangeParsed.range),
      ]);
    } catch (err) {
      console.error("[dashboard] performance load failed", err);
      performanceError = "Unable to load performance data.";
    }
  }

  const rangePresets = dashboardRangePresets(timeZone);

  return (
    <div className="space-y-[18px]">
      <header>
        <h1 className={dashboardType.pageTitle}>{data.pageTitle}</h1>
        <p className={`mt-1 ${dashboardType.pageSubtitle}`}>{data.pageSubtitle}</p>
      </header>

      {gettingStarted.percent < 100 && bookingUrl ? (
        <GettingStartedChecklist
          tasks={gettingStarted.tasks}
          percent={gettingStarted.percent}
          bookingUrl={bookingUrl}
        />
      ) : null}

      <TopKpiGrid stats={data.queueStats} />

      {data.showPerformance && (performanceOverview || revenuePerformance || performanceError) ? (
        <div className="space-y-3">
          {rangeError ? <p className="text-sm text-[#F04438]">{rangeError}</p> : null}
          {performanceError ? <p className="text-sm text-[#F04438]">{performanceError}</p> : null}
          {performanceOverview && revenuePerformance ? (
            <Suspense fallback={null}>
              <PerformanceSection
                performanceOverview={performanceOverview}
                revenuePerformance={revenuePerformance}
                currency={currency}
                rangePresets={rangePresets}
              />
            </Suspense>
          ) : null}
        </div>
      ) : null}

      <OperationsSection jobs={data.upcomingJobs} activity={data.activity} />
    </div>
  );
}
