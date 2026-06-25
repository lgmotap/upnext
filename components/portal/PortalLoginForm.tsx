"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { KeyRound, Loader2, Mail } from "lucide-react";
import {
  requestPortalMagicLinkAction,
  signInPortalPasswordAction,
} from "@/server/actions/customer-portal";
import { site } from "@/lib/config";

function MagicSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-400 py-3 text-sm font-bold text-brand-950 hover:bg-brand-300 disabled:opacity-70"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
      {pending ? "Sending link…" : "Email me a sign-in link"}
    </button>
  );
}

function PasswordSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-400 py-3 text-sm font-bold text-brand-950 hover:bg-brand-300 disabled:opacity-70"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
      {pending ? "Signing in…" : "Sign in with password"}
    </button>
  );
}

export function PortalLoginForm({
  businessSlug,
  businessName,
  passwordLoginEnabled,
  error,
  message,
  sent,
}: {
  businessSlug: string;
  businessName: string;
  passwordLoginEnabled?: boolean;
  error?: string;
  message?: string;
  sent?: boolean;
}) {
  const [mode, setMode] = useState<"magic" | "password">("magic");

  return (
    <div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-ink-100">
      <p className="text-xs font-bold uppercase tracking-wider text-brand-700">Customer portal</p>
      <h1 className="mt-2 text-2xl font-bold text-ink-950">{businessName}</h1>
      <p className="mt-2 text-sm text-ink-600">
        {passwordLoginEnabled && mode === "password"
          ? "Sign in with the email and password on your account."
          : "Enter the email on your account. We'll send a secure link — no password needed."}
      </p>

      {passwordLoginEnabled && (
        <div className="mt-4 flex gap-1 rounded-full bg-ink-50 p-1 ring-1 ring-ink-100">
          <button
            type="button"
            onClick={() => setMode("magic")}
            className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold ${
              mode === "magic" ? "bg-white text-ink-950 shadow-sm" : "text-ink-500"
            }`}
          >
            Magic link
          </button>
          <button
            type="button"
            onClick={() => setMode("password")}
            className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold ${
              mode === "password" ? "bg-white text-ink-950 shadow-sm" : "text-ink-500"
            }`}
          >
            Password
          </button>
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-rose-100">
          {error}
        </p>
      )}
      {message && (
        <p className="mt-4 rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-900 ring-1 ring-brand-100">
          {message}
        </p>
      )}
      {sent && mode === "magic" && (
        <p className="mt-4 rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-900 ring-1 ring-brand-100">
          If we have an account for that email, a sign-in link is on its way. Check your inbox (link
          expires in 15 minutes).
        </p>
      )}

      {mode === "password" && passwordLoginEnabled ? (
        <form action={signInPortalPasswordAction} className="mt-6 space-y-3">
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
          <label className="block text-xs font-semibold uppercase tracking-wide text-ink-400">
            Password
          </label>
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className="w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-ink-900 ring-1 ring-ink-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <PasswordSubmitButton />
          <Link
            href={`/my/${businessSlug}/forgot-password`}
            className="block text-center text-xs font-semibold text-brand-700 hover:underline"
          >
            Forgot password?
          </Link>
        </form>
      ) : (
        <form action={requestPortalMagicLinkAction} className="mt-6 space-y-3">
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
          <MagicSubmitButton />
        </form>
      )}

      <p className="mt-4 text-center text-xs text-ink-400">Powered by {site.name}</p>
    </div>
  );
}
