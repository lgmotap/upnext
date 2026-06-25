import Link from "next/link";
import { redirect } from "next/navigation";
import { PortalLoginForm } from "@/components/portal/PortalLoginForm";
import { getPortalSessionFromCookies } from "@/lib/portal/session";
import { loadPortalContext } from "@/server/services/customer-portal";

export default async function CustomerPortalLandingPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ error?: string; sent?: string; message?: string }>;
}) {
  const { businessSlug } = await params;
  const query = await searchParams;
  const profile = await loadPortalContext(businessSlug);

  if (!profile) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-ink-950">Portal not found</h1>
        <p className="mt-2 text-sm text-ink-500">This business does not have a customer portal yet.</p>
        <Link href="/" className="mt-4 inline-block text-sm font-semibold text-brand-700">
          Go home
        </Link>
      </main>
    );
  }

  const session = await getPortalSessionFromCookies();
  if (session?.businessSlug === businessSlug) {
    redirect(`/my/${businessSlug}/dashboard`);
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">
      <PortalLoginForm
        businessSlug={businessSlug}
        businessName={profile.displayName}
        passwordLoginEnabled={profile.portalPasswordLoginEnabled}
        error={query.error ? decodeURIComponent(query.error) : undefined}
        message={query.message ? decodeURIComponent(query.message) : undefined}
        sent={query.sent === "1"}
      />
      <Link
        href={`/book/${businessSlug}`}
        className="mt-4 block text-center text-sm font-semibold text-brand-700 hover:underline"
      >
        New customer? Book without signing in
      </Link>
    </main>
  );
}
