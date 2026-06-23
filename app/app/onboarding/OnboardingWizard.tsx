"use client";

import { useState } from "react";
import { Check, ArrowRight, ArrowLeft, Copy, Globe } from "lucide-react";
import { CURRENCIES, TIMEZONES } from "@/server/validators/onboarding";
import { completeOnboardingAction } from "@/server/actions/onboarding";

const input =
  "w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-ink-900 ring-1 ring-ink-200 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-400";
const label = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400";

type Defaults = {
  displayName: string;
  timezone: string;
  currency: string;
  serviceArea: string;
  phone: string;
  description: string;
};

export function OnboardingWizard({
  defaults,
  bookingUrl,
  error,
}: {
  defaults: Defaults;
  bookingUrl: string;
  error?: string;
}) {
  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — ignore */
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      {/* progress */}
      <div className="mb-6 flex items-center gap-2">
        {[1, 2].map((n) => (
          <div
            key={n}
            className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-brand-400" : "bg-ink-200"}`}
          />
        ))}
      </div>

      <form action={completeOnboardingAction} className="rounded-3xl bg-white p-6 ring-1 ring-ink-100 shadow-soft sm:p-8">
        {error && (
          <p className="mb-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-rose-100">{error}</p>
        )}

        {/* Step 1 — business details (always in DOM so values submit) */}
        <div className={step === 1 ? "block" : "hidden"}>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-700">Step 1 of 2</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-950">Set up your business</h1>
          <p className="mt-1 text-sm text-ink-500">A few details so your booking page and schedule work correctly.</p>

          <div className="mt-5 space-y-4">
            <div>
              <label className={label} htmlFor="displayName">Business name</label>
              <input id="displayName" name="displayName" defaultValue={defaults.displayName} className={input} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label} htmlFor="timezone">Timezone</label>
                <select id="timezone" name="timezone" defaultValue={defaults.timezone} className={input}>
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label} htmlFor="currency">Currency</label>
                <select id="currency" name="currency" defaultValue={defaults.currency} className={input}>
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={label} htmlFor="serviceArea">Service area</label>
              <input id="serviceArea" name="serviceArea" defaultValue={defaults.serviceArea} placeholder="e.g. Greater Austin, TX" className={input} />
            </div>
            <div>
              <label className={label} htmlFor="phone">Contact phone</label>
              <input id="phone" name="phone" defaultValue={defaults.phone} placeholder="(512) 555-0142" className={input} />
            </div>
            <div>
              <label className={label} htmlFor="description">Short description</label>
              <textarea id="description" name="description" defaultValue={defaults.description} rows={2} placeholder="What you do, in one line." className={input} />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-400 px-5 py-2.5 text-sm font-bold text-brand-950 hover:bg-brand-300"
            >
              Continue <ArrowRight className="size-4" />
            </button>
          </div>
        </div>

        {/* Step 2 — share booking page + submit */}
        <div className={step === 2 ? "block" : "hidden"}>
          <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
            <Globe className="size-6" />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink-950">Your booking page is ready</h1>
          <p className="mt-1 text-sm text-ink-500">Share this link so customers can request bookings. You can add services and availability next.</p>

          <div className="mt-4 flex items-center gap-2 rounded-xl bg-ink-50 p-2 ring-1 ring-ink-200">
            <span className="truncate px-2 text-sm text-ink-700">{bookingUrl}</span>
            <button type="button" onClick={copy} className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 ring-1 ring-ink-200 hover:ring-brand-400">
              {copied ? <Check className="size-3.5 text-brand-600" /> : <Copy className="size-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button type="button" onClick={() => setStep(1)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink-900">
              <ArrowLeft className="size-4" /> Back
            </button>
            <button type="submit" className="inline-flex items-center gap-1.5 rounded-full bg-brand-400 px-5 py-2.5 text-sm font-bold text-brand-950 hover:bg-brand-300">
              Finish &amp; go to dashboard <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
