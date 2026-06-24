"use client";

import { ErrorFallback } from "@/components/app/ErrorFallback";

export default function ProductAppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Could not load this page"
      error={error}
      reset={reset}
      links={[
        { href: "/app/dashboard", label: "Dashboard" },
        { href: "/app/bookings", label: "Bookings" },
      ]}
    />
  );
}
