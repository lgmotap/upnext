import Link from "next/link";
import { PortalSetPasswordForm } from "@/components/portal/PortalSetPasswordForm";

export default async function PortalSetPasswordPage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">
      <PortalSetPasswordForm businessSlug={businessSlug} />
      <Link
        href={`/my/${businessSlug}`}
        className="mt-4 block text-center text-sm font-semibold text-brand-700 hover:underline"
      >
        Back to sign in
      </Link>
    </main>
  );
}
