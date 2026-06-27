"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { captureClientException } from "@/lib/sentry/client";

export type ErrorLink = { href: string; label: string };

export function ErrorFallback({
  title,
  description,
  error,
  reset,
  links = [],
}: {
  title: string;
  description?: string;
  error: Error & { digest?: string };
  reset: () => void;
  links?: ErrorLink[];
}) {
  useEffect(() => {
    captureClientException(error);
  }, [error]);

  const message = description ?? error.message ?? "Something went wrong. Please try again.";

  return (
    <div
      role="alert"
      className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-12 text-center"
    >
      <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
        <AlertTriangle className="size-7" aria-hidden />
      </span>
      <h1 className="text-2xl font-bold text-ink-950">{title}</h1>
      <p className="mt-2 max-w-md text-sm text-ink-600">{message}</p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-ink-400">Reference: {error.digest}</p>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-brand-400 px-4 py-2 text-sm font-bold text-brand-950 hover:bg-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
        >
          Try again
        </button>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-full px-4 py-2 text-sm font-semibold text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
