"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function PortalSetPasswordForm({ businessSlug }: { businessSlug: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    await supabase.auth.signOut();
    setPending(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push(
      `/my/${businessSlug}?message=${encodeURIComponent("Password updated. Sign in with your new password.")}`,
    );
    router.refresh();
  }

  return (
    <div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-ink-100">
      <h1 className="text-2xl font-bold text-ink-950">Set your password</h1>
      <p className="mt-2 text-sm text-ink-600">Choose a password for future portal sign-ins.</p>

      {error && (
        <p className="mt-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{error}</p>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <label className="block text-xs font-semibold uppercase tracking-wide text-ink-400">
          New password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-ink-900 ring-1 ring-ink-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
        <label className="block text-xs font-semibold uppercase tracking-wide text-ink-400">
          Confirm password
        </label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-ink-900 ring-1 ring-ink-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-brand-400 py-3 text-sm font-bold text-brand-950 hover:bg-brand-300 disabled:opacity-70"
        >
          {pending ? "Saving…" : "Save password"}
        </button>
      </form>
    </div>
  );
}
