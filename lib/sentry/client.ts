/** Client-side Sentry helpers — no-op when DSN is unset. */

export function isSentryEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN?.trim());
}

export function captureClientException(error: unknown): void {
  if (!isSentryEnabled()) return;
  void import("@sentry/nextjs").then((Sentry) => {
    Sentry.captureException(error);
  });
}
