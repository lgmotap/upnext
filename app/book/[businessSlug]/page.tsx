import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBusinessProfileBySlug } from "@/server/repositories/services";
import { PublicBookingView } from "./PublicBookingView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}): Promise<Metadata> {
  const { businessSlug } = await params;
  const profile = await getBusinessProfileBySlug(businessSlug);
  if (!profile) return { title: "Book online" };

  const title = `Book ${profile.displayName} online`;
  const description =
    profile.description?.trim() ||
    `Request an appointment with ${profile.displayName}${profile.serviceArea ? ` in ${profile.serviceArea}` : ""}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function PublicBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { businessSlug } = await params;
  const query = await searchParams;

  if (query.embed === "1") {
    notFound();
  }

  return <PublicBookingView businessSlug={businessSlug} searchParams={query} />;
}
