"use client";

import { ErrorFallback } from "@/components/app/ErrorFallback";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Something went wrong"
      error={error}
      reset={reset}
      links={[
        { href: "/", label: "Home" },
        { href: "/sign-in", label: "Sign in" },
      ]}
    />
  );
}
