"use client";

import { useFormStatus } from "react-dom";
import { Loader2, Mail } from "lucide-react";
import { requestPortalPasswordResetAction } from "@/server/actions/customer-portal";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-400 py-3 text-sm font-bold text-brand-950 hover:bg-brand-600 disabled:opacity-70"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
      {pending ? "Sending…" : "Send reset link"}
    </button>
  );
}

export function PortalForgotPasswordForm({
  businessSlug,
  businessName,
  error,
  sent,
}: {
  businessSlug: string;
  businessName: string;
  error?: string;
  sent?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-ink-100">
      <p className="text-xs font-bold uppercase tracking-wider text-brand-700">Reset password</p>
      <h1 className="mt-2 text-2xl font-bold text-ink-950">{businessName}</h1>
      <p className="mt-2 text-sm text-ink-600">
        Enter your email and we&apos;ll send a link to set a new password.
      </p>

      {error && (
        <p className="mt-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-rose-100">
          {error}
        </p>
      )}
      {sent && (
        <p className="mt-4 rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-900 ring-1 ring-brand-100">
          If we have a password account for that email, a reset link is on its way.
        </p>
      )}

      <form action={requestPortalPasswordResetAction} className="mt-6 space-y-3">
        <input type="hidden" name="businessSlug" value={businessSlug} />
        <label className="block text-xs font-semibold uppercase tracking-wide text-ink-400">
          Your email
        </label>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-ink-900 ring-1 ring-ink-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
        <SubmitButton />
      </form>
    </div>
  );
}
