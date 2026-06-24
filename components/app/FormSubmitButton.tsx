"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

export function FormSubmitButton({
  children,
  loadingLabel = "Saving…",
  className = "",
  variant = "primary",
}: {
  children: React.ReactNode;
  loadingLabel?: string;
  className?: string;
  variant?: "primary" | "outline" | "danger";
}) {
  const { pending } = useFormStatus();
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-70";
  const variants = {
    primary: "bg-brand-400 text-brand-950 hover:bg-brand-300",
    outline: "font-semibold text-ink-700 ring-1 ring-ink-200 hover:bg-ink-100",
    danger: "bg-rose-600 text-white hover:bg-rose-500",
  };

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${base} ${variants[variant]} ${className}`}
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
