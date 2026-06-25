import Link from "next/link";
import { redirect } from "next/navigation";
import { PortalForgotPasswordForm } from "@/components/portal/PortalForgotPasswordForm";
import { loadPortalContext } from "@/server/services/customer-portal";

export default async function PortalForgotPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { businessSlug } = await params;
  const query = await searchParams;
  const profile = await loadPortalContext(businessSlug);

  if (!profile) {
    redirect(`/my/${businessSlug}`);
  }

  if (!profile.portalPasswordLoginEnabled) {
    redirect(`/my/${businessSlug}`);
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">
      <PortalForgotPasswordForm
        businessSlug={businessSlug}
        businessName={profile.displayName}
        error={query.error ? decodeURIComponent(query.error) : undefined}
        sent={query.sent === "1"}
      />
      <Link
        href={`/my/${businessSlug}`}
        className="mt-4 block text-center text-sm font-semibold text-brand-700 hover:underline"
      >
        Back to sign in
      </Link>
    </main>
  );
}
