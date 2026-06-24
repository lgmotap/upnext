"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, ArrowRight, ArrowLeft, Copy, Globe, Loader2, MapPin, Briefcase } from "lucide-react";
import { serviceTypes, teamSizes } from "@/lib/config";
import { catalogStats, getIndustryCatalog } from "@/lib/onboarding/industry-catalog";
import { CURRENCIES, TIMEZONES, US_REGIONS } from "@/server/validators/onboarding";
import { completeOnboardingAction } from "@/server/actions/onboarding";

const input =
  "w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-ink-900 ring-1 ring-ink-200 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-400";
const label = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400";

type Defaults = {
  businessType: string;
  teamSize: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  displayName: string;
  timezone: string;
  currency: string;
  serviceArea: string;
  phone: string;
  description: string;
};

const STEPS = 4;

function FinishButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-full bg-brand-400 px-5 py-2.5 text-sm font-bold text-brand-950 hover:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" /> Setting up…
        </>
      ) : (
        <>
          Finish &amp; go to dashboard <ArrowRight className="size-4" />
        </>
      )}
    </button>
  );
}

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
  const [localError, setLocalError] = useState<string | null>(null);
  const [businessType, setBusinessType] = useState(defaults.businessType);

  const catalog = useMemo(() => getIndustryCatalog(businessType || serviceTypes[0]), [businessType]);
  const stats = useMemo(() => catalogStats(businessType || serviceTypes[0]), [businessType]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };

  const validateStep = (form: HTMLFormElement): boolean => {
    setLocalError(null);
    const fd = new FormData(form);
    if (step === 1) {
      if (!fd.get("businessType") || !fd.get("teamSize")) {
        setLocalError("Choose your service type and team size.");
        return false;
      }
    }
    if (step === 2) {
      for (const field of ["addressLine1", "city", "region", "postalCode"] as const) {
        if (!String(fd.get(field) ?? "").trim()) {
          setLocalError("Please complete your business address.");
          return false;
        }
      }
    }
    if (step === 3) {
      if (!String(fd.get("displayName") ?? "").trim()) {
        setLocalError("Business name is required.");
        return false;
      }
    }
    return true;
  };

  const goNext = (form: HTMLFormElement) => {
    if (!validateStep(form)) return;
    if (step === 1) {
      const bt = String(new FormData(form).get("businessType") ?? businessType);
      setBusinessType(bt);
    }
    setStep((s) => Math.min(STEPS, s + 1));
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex items-center gap-2">
        {Array.from({ length: STEPS }, (_, i) => i + 1).map((n) => (
          <div
            key={n}
            className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-brand-400" : "bg-ink-200"}`}
          />
        ))}
      </div>

      <form action={completeOnboardingAction} className="rounded-3xl bg-white p-6 ring-1 ring-ink-100 shadow-soft sm:p-8">
        {(error || localError) && (
          <p className="mb-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-rose-100">
            {localError ?? error}
          </p>
        )}

        {/* Step 1 — industry */}
        <div className={step === 1 ? "block" : "hidden"}>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-700">Step 1 of {STEPS}</p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-ink-950">
            <Briefcase className="size-6 text-brand-600" /> What kind of business?
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            We&apos;ll add a full starter service catalog — like ConvertLabs — tailored to your trade.
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <label className={label} htmlFor="businessType">Primary service type</label>
              <select
                id="businessType"
                name="businessType"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className={input}
                required
              >
                <option value="">Select…</option>
                {serviceTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="teamSize">Team size</label>
              <select
                id="teamSize"
                name="teamSize"
                defaultValue={defaults.teamSize}
                className={input}
                required
              >
                <option value="">Select…</option>
                {teamSizes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={(e) => goNext(e.currentTarget.form!)}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-400 px-5 py-2.5 text-sm font-bold text-brand-950 hover:bg-brand-300"
            >
              Continue <ArrowRight className="size-4" />
            </button>
          </div>
        </div>

        {/* Step 2 — address */}
        <div className={step === 2 ? "block" : "hidden"}>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-700">Step 2 of {STEPS}</p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-ink-950">
            <MapPin className="size-6 text-brand-600" /> Where are you based?
          </h1>
          <p className="mt-1 text-sm text-ink-500">Your business address helps customers know your service area.</p>

          <div className="mt-5 space-y-4">
            <div>
              <label className={label} htmlFor="addressLine1">Street address</label>
              <input id="addressLine1" name="addressLine1" defaultValue={defaults.addressLine1} placeholder="123 Main St" className={input} required />
            </div>
            <div>
              <label className={label} htmlFor="addressLine2">Suite / unit (optional)</label>
              <input id="addressLine2" name="addressLine2" defaultValue={defaults.addressLine2} placeholder="Suite 4B" className={input} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label} htmlFor="city">City</label>
                <input id="city" name="city" defaultValue={defaults.city} className={input} required />
              </div>
              <div>
                <label className={label} htmlFor="region">State</label>
                <select id="region" name="region" defaultValue={defaults.region || ""} className={input} required>
                  <option value="">Select…</option>
                  {US_REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={label} htmlFor="postalCode">ZIP code</label>
              <input id="postalCode" name="postalCode" defaultValue={defaults.postalCode} className={input} required />
            </div>
            <input type="hidden" name="country" value={defaults.country || "US"} />
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button type="button" onClick={() => setStep(1)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink-900">
              <ArrowLeft className="size-4" /> Back
            </button>
            <button type="button" onClick={(e) => goNext(e.currentTarget.form!)} className="inline-flex items-center gap-1.5 rounded-full bg-brand-400 px-5 py-2.5 text-sm font-bold text-brand-950 hover:bg-brand-300">
              Continue <ArrowRight className="size-4" />
            </button>
          </div>
        </div>

        {/* Step 3 — business details */}
        <div className={step === 3 ? "block" : "hidden"}>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-700">Step 3 of {STEPS}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-950">Business details</h1>
          <p className="mt-1 text-sm text-ink-500">Shown on your booking page and customer emails.</p>

          <div className="mt-5 space-y-4">
            <div>
              <label className={label} htmlFor="displayName">Business name</label>
              <input id="displayName" name="displayName" defaultValue={defaults.displayName} className={input} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label} htmlFor="timezone">Timezone</label>
                <select id="timezone" name="timezone" defaultValue={defaults.timezone} className={input} required>
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label} htmlFor="currency">Currency</label>
                <select id="currency" name="currency" defaultValue={defaults.currency} className={input} required>
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={label} htmlFor="serviceArea">Service area (optional)</label>
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

          <div className="mt-6 flex items-center justify-between">
            <button type="button" onClick={() => setStep(2)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink-900">
              <ArrowLeft className="size-4" /> Back
            </button>
            <button type="button" onClick={(e) => goNext(e.currentTarget.form!)} className="inline-flex items-center gap-1.5 rounded-full bg-brand-400 px-5 py-2.5 text-sm font-bold text-brand-950 hover:bg-brand-300">
              Continue <ArrowRight className="size-4" />
            </button>
          </div>
        </div>

        {/* Step 4 — catalog preview + booking link */}
        <div className={step === 4 ? "block" : "hidden"}>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-700">Step 4 of {STEPS}</p>
          <span className="mt-2 flex size-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
            <Globe className="size-6" />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink-950">Your starter catalog</h1>
          <p className="mt-1 text-sm text-ink-500">
            We&apos;ll add <strong>{stats.primaryCount} services</strong> and{" "}
            <strong>{stats.addonCount} add-ons</strong> for {stats.label}. Edit prices anytime under Services.
          </p>

          <div className="mt-5 max-h-56 space-y-3 overflow-y-auto rounded-xl bg-ink-50 p-4 ring-1 ring-ink-100">
            <div>
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-ink-400">Services</p>
              <ul className="space-y-1">
                {catalog.primary.map((s) => (
                  <li key={s.name} className="text-sm text-ink-800">
                    {s.name}
                    <span className="ml-2 text-xs text-ink-400">{s.durationMinutes} min</span>
                  </li>
                ))}
              </ul>
            </div>
            {catalog.addons.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-ink-400">Add-ons &amp; extras</p>
                <ul className="space-y-1">
                  {catalog.addons.map((s) => (
                    <li key={s.name} className="text-sm text-ink-700">
                      {s.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-xl bg-ink-50 p-2 ring-1 ring-ink-200">
            <span className="truncate px-2 text-sm text-ink-700">{bookingUrl}</span>
            <button type="button" onClick={copy} className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 ring-1 ring-ink-200 hover:ring-brand-400">
              {copied ? <Check className="size-3.5 text-brand-600" /> : <Copy className="size-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button type="button" onClick={() => setStep(3)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink-900">
              <ArrowLeft className="size-4" /> Back
            </button>
            <FinishButton />
          </div>
        </div>
      </form>
    </div>
  );
}
