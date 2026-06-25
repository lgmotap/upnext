import { redirect } from "next/navigation";
import { CustomerPortalDashboard } from "@/components/portal/CustomerPortalDashboard";
import { getPortalSessionFromCookies } from "@/lib/portal/session";
import { getPortalDashboardData } from "@/server/services/customer-portal";

export default async function CustomerPortalDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ error?: string; cancelled?: string; rescheduled?: string; tab?: string; card?: string; paid?: string }>;
}) {
  const { businessSlug } = await params;
  const query = await searchParams;
  const session = await getPortalSessionFromCookies();

  if (!session || session.businessSlug !== businessSlug) {
    redirect(`/my/${businessSlug}`);
  }

  const data = await getPortalDashboardData(session);
  if (!data) {
    redirect(`/my/${businessSlug}?error=${encodeURIComponent("Session expired. Sign in again.")}`);
  }

  const initialTab =
    query.tab === "payments" || query.tab === "book" || query.tab === "history"
      ? query.tab
      : "history";

  return (
    <CustomerPortalDashboard
      businessSlug={businessSlug}
      businessName={data.businessName}
      customerName={data.customerName}
      bookings={data.bookings}
      payments={data.payments}
      bookAgainUrl={data.bookAgainUrl}
      prefill={data.prefill}
      primaryServices={data.primaryServices}
      faq={data.faq}
      stripePaymentsEnabled={data.stripePaymentsEnabled}
      savedPaymentMethods={data.savedPaymentMethods}
      cleaningPlan={data.cleaningPlan}
      initialTab={initialTab}
      flash={{
        error: query.error ? decodeURIComponent(query.error) : undefined,
        cancelled: query.cancelled === "1",
        rescheduled: query.rescheduled === "1",
        cardAdded: query.card === "added",
        paid: query.paid === "1",
      }}
    />
  );
}
