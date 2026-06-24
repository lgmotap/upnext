"use client";

import { ErrorFallback } from "@/components/app/ErrorFallback";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Sign-in error"
      error={error}
      reset={reset}
      links={[
        { href: "/sign-in", label: "Sign in" },
        { href: "/", label: "Home" },
      ]}
    />
  );
}
