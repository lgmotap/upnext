"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink, Code2 } from "lucide-react";
import { getBookingEmbedHtml } from "@/lib/url/app";

type Tab = "link" | "embed";

export function BookingLinkCard({
  url,
  embedHtml: embedHtmlProp,
  publicSlug,
  showMisconfigWarning = false,
  className = "",
}: {
  url: string;
  /** Precomputed embed HTML (supports custom domains). Falls back to slug-based embed. */
  embedHtml?: string;
  publicSlug?: string;
  showMisconfigWarning?: boolean;
  className?: string;
}) {
  const [tab, setTab] = useState<Tab>("link");
  const [copied, setCopied] = useState(false);
  const embedHtml = embedHtmlProp ?? (publicSlug ? getBookingEmbedHtml(publicSlug) : "");

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  if (!url) {
    return (
      <p className="text-sm text-ink-500">
        Complete onboarding to get your public booking link.
      </p>
    );
  }

  return (
    <div className={className}>
      {showMisconfigWarning && (
        <p className="mb-3 rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900 ring-1 ring-amber-100">
          Booking links use <code className="text-xs">localhost</code> because{" "}
          <code className="text-xs">NEXT_PUBLIC_APP_URL</code> is not set for this environment.
          Set it on Vercel (e.g. your production domain) so customers get a working link.
        </p>
      )}

      <div className="mb-3 flex gap-1 rounded-lg bg-ink-50 p-1 ring-1 ring-ink-100">
        <button
          type="button"
          onClick={() => setTab("link")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ${
            tab === "link" ? "bg-white text-ink-900 shadow-sm" : "text-ink-500"
          }`}
        >
          <ExternalLink className="size-3.5" /> Booking link
        </button>
        <button
          type="button"
          onClick={() => setTab("embed")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ${
            tab === "embed" ? "bg-white text-ink-900 shadow-sm" : "text-ink-500"
          }`}
        >
          <Code2 className="size-3.5" /> Embed code
        </button>
      </div>

      {tab === "link" ? (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              readOnly
              value={url}
              className="min-w-0 flex-1 rounded-xl bg-ink-50 px-3.5 py-2.5 text-sm text-ink-800 ring-1 ring-ink-200"
              onFocus={(e) => e.target.select()}
            />
            <button
              type="button"
              onClick={() => copy(url)}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-brand-400 px-4 py-2.5 text-sm font-bold text-brand-950 hover:bg-brand-600"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
          <Link
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
          >
            Preview booking page <ExternalLink className="size-3.5" />
          </Link>
        </>
      ) : (
        <>
          <textarea
            readOnly
            rows={4}
            value={embedHtml}
            className="w-full rounded-xl bg-ink-50 px-3.5 py-2.5 font-mono text-xs text-ink-800 ring-1 ring-ink-200"
            onFocus={(e) => e.target.select()}
          />
          <button
            type="button"
            onClick={() => copy(embedHtml)}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold ring-1 ring-ink-200 text-ink-700 hover:ring-brand-400"
          >
            {copied ? <Check className="size-4 text-brand-600" /> : <Copy className="size-4" />}
            {copied ? "Copied" : "Copy embed code"}
          </button>
          <p className="mt-2 text-xs text-ink-500">
            Paste into your website HTML. Uses the chrome-free <code className="text-xs">/embed</code> route.
          </p>
        </>
      )}
    </div>
  );
}
