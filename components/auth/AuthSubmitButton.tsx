"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

export function AuthSubmitButton({
  children,
  loadingLabel,
}: {
  children: React.ReactNode;
  loadingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-400 py-2.5 text-sm font-bold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
