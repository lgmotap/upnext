/** Server-side Sentry helpers — no-op when DSN is unset. */

export function isSentryEnabled(): boolean {
  return Boolean(process.env.SENTRY_DSN?.trim());
}

export async function captureServerException(error: unknown, context?: Record<string, unknown>): Promise<void> {
  if (!isSentryEnabled()) return;
  const Sentry = await import("@sentry/nextjs");
  if (context) {
    Sentry.withScope((scope) => {
      scope.setContext("extra", context);
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}
