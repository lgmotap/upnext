"use client";

import { ErrorFallback } from "@/components/app/ErrorFallback";

export default function PublicBookingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Booking page unavailable"
      description="We couldn't load this booking page. The business may have disabled online booking."
      error={error}
      reset={reset}
      links={[{ href: "/", label: "Back to UpNext" }]}
    />
  );
}
