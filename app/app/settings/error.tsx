"use client";

import { ErrorFallback } from "@/components/app/ErrorFallback";

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Could not load settings"
      error={error}
      reset={reset}
      links={[{ href: "/app/dashboard", label: "Back to dashboard" }]}
    />
  );
}
