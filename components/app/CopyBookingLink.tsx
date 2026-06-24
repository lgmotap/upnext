"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyBookingLink({
  url,
  className = "",
  label = "Copy booking link",
}: {
  url: string;
  className?: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold ring-1 ring-ink-200 text-ink-700 hover:ring-brand-400 ${className}`}
    >
      {copied ? <Check className="size-4 text-brand-600" /> : <Copy className="size-4" />}
      {copied ? "Copied" : label}
    </button>
  );
}
