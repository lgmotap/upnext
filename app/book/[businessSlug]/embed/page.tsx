import type { Metadata } from "next";
import { PublicBookingView } from "../PublicBookingView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}): Promise<Metadata> {
  const { businessSlug } = await params;
  return {
    title: `Book online`,
    robots: { index: true, follow: true },
  };
}

export default async function PublicBookingEmbedPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { businessSlug } = await params;
  const query = await searchParams;
  return <PublicBookingView businessSlug={businessSlug} searchParams={query} embedded />;
}
