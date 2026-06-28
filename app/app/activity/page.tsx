import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardHeader, PageHeader } from "@/components/app/ui";
import { DashboardActivityFeed } from "@/components/app/dashboard/DashboardActivityFeed";
import { getAppSession } from "@/server/permissions/session";
import { getOrgActivityFeed } from "@/server/services/activity-feed";
import { prisma } from "@/lib/db/prisma";

export const metadata: Metadata = {
  title: "Activity",
  robots: { index: false, follow: false },
};

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ before?: string }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/sign-in?next=/app/activity");

  const params = await searchParams;
  const beforeRaw = params.before;
  let before: Date | undefined;
  if (beforeRaw) {
    const parsed = new Date(beforeRaw);
    if (!Number.isNaN(parsed.getTime())) before = parsed;
  }

  const org = await prisma.organization.findUnique({
    where: { id: session.organizationId },
    select: { timezone: true, currency: true },
  });
  const timeZone = org?.timezone ?? "America/New_York";
  const currency = org?.currency ?? "USD";

  const { items, hasMore } = await getOrgActivityFeed(session.organizationId, timeZone, currency, {
    limit: 50,
    before,
  });

  const nextBefore = hasMore ? items[items.length - 1]?.at.toISOString() : null;

  return (
    <>
      <PageHeader
        title="Activity"
        subtitle="Bookings, jobs, payments, and crew updates across your business."
        action={
          <Link href="/app/dashboard" className="text-sm font-semibold text-brand-700 hover:underline">
            Back to dashboard
          </Link>
        }
      />

      <Card>
        <CardHeader title="All activity" />
        <DashboardActivityFeed items={items} />
        {hasMore && nextBefore ? (
          <div className="border-t border-ink-100 px-5 py-4 text-center">
            <Link
              href={`/app/activity?before=${encodeURIComponent(nextBefore)}`}
              className="text-sm font-semibold text-brand-700 hover:underline"
            >
              Load more
            </Link>
          </div>
        ) : null}
      </Card>
    </>
  );
}
