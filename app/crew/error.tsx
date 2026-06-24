"use client";

import { ErrorFallback } from "@/components/app/ErrorFallback";

export default function CrewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Crew view error"
      error={error}
      reset={reset}
      links={[{ href: "/crew", label: "My jobs" }]}
    />
  );
}
