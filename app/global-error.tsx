"use client";

import { ErrorFallback } from "@/components/app/ErrorFallback";
import { site } from "@/lib/config";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        <ErrorFallback
          title="Something went wrong"
          description={`${site.name} hit an unexpected error. Our team has been notified if error tracking is enabled.`}
          error={error}
          reset={reset}
          links={[{ href: "/", label: "Go home" }]}
        />
      </body>
    </html>
  );
}
