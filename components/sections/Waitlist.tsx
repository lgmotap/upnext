"use client";

import { useState } from "react";
import { Loader2, PartyPopper, Lock } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { waitlistForm, serviceTypes, teamSizes, currentTools } from "@/lib/config";
import { SprayBottle, Calendar3D, Sparkle } from "@/components/three-d/Objects";

type Status = "idle" | "submitting" | "success" | "error";

const inputCls =
  "w-full rounded-xl border-0 bg-white px-4 py-3 text-sm text-ink-950 shadow-soft ring-1 ring-ink-200 placeholder:text-ink-400 focus:ring-2 focus:ring-brand-500 focus:outline-none";
const labelCls = "mb-1.5 block text-sm font-semibold";

export function Waitlist() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting" || status === "success") return;

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("submitting");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, source: window.location.pathname }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? `HTTP ${res.status}`);
      }
      setStatus("success");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : waitlistForm.errorMessage);
      setStatus("error");
    }
  }

  return (
    <Section id="waitlist" className="relative overflow-hidden bg-brand-950">
      <div className="absolute -left-32 top-0 size-96 rounded-full bg-brand-500/18 blur-3xl" />
      <div className="absolute -right-32 bottom-0 size-96 rounded-full bg-brand-400/12 blur-3xl" />
      <SprayBottle className="animate-float absolute left-[6%] top-16 hidden w-16 opacity-80 lg:block [--tilt:-10deg]" />
      <Calendar3D className="animate-float-delayed absolute right-[7%] top-24 hidden w-16 opacity-80 lg:block [--tilt:8deg]" />
      <Sparkle className="animate-float-late absolute bottom-16 left-[12%] hidden w-10 opacity-70 lg:block" />

      <div className="relative mx-auto max-w-2xl text-center">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-400/20 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-300">
          <Lock className="size-3.5" /> Exclusive early access
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl text-balance">
          {waitlistForm.title}
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-ink-300 text-pretty">
          {waitlistForm.subtitle}
        </p>

        {status === "success" ? (
          <div className="mt-10 rounded-3xl bg-white/95 p-10 shadow-float" role="status">
            <span className="mb-4 inline-flex size-14 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <PartyPopper className="size-7" aria-hidden />
            </span>
            <h3 className="text-xl font-bold text-ink-950">You&apos;re on the list 🎉</h3>
            <p className="mt-2 text-ink-600">{waitlistForm.successMessage}</p>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="mt-10 rounded-3xl bg-white/[0.06] p-6 text-left ring-1 ring-white/10 backdrop-blur sm:p-8"
            noValidate={false}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="wl-name" className={`${labelCls} text-ink-100`}>
                  First name <span className="text-brand-500">*</span>
                </label>
                <input id="wl-name" name="firstName" required autoComplete="given-name" placeholder="Alex" className={inputCls} />
              </div>
              <div>
                <label htmlFor="wl-email" className={`${labelCls} text-ink-100`}>
                  Email <span className="text-brand-500">*</span>
                </label>
                <input id="wl-email" name="email" type="email" required autoComplete="email" placeholder="alex@yourbusiness.com" className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="wl-business" className={`${labelCls} text-ink-100`}>
                  Business name <span className="text-brand-500">*</span>
                </label>
                <input id="wl-business" name="businessName" required autoComplete="organization" placeholder="Sparkle & Shine Cleaning Co." className={inputCls} />
              </div>
              <div>
                <label htmlFor="wl-type" className={`${labelCls} text-ink-100`}>
                  Service type <span className="text-brand-500">*</span>
                </label>
                <select id="wl-type" name="businessType" required defaultValue="" className={inputCls}>
                  <option value="" disabled>
                    Select your service…
                  </option>
                  {serviceTypes.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="wl-size" className={`${labelCls} text-ink-100`}>
                  Team size <span className="text-brand-500">*</span>
                </label>
                <select id="wl-size" name="businessSize" required defaultValue="" className={inputCls}>
                  <option value="" disabled>
                    Select team size…
                  </option>
                  {teamSizes.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="wl-tool" className={`${labelCls} text-ink-100`}>
                  What do you currently use to manage your business?{" "}
                  <span className="text-brand-500">*</span>
                </label>
                <select id="wl-tool" name="currentTool" required defaultValue="" className={inputCls}>
                  <option value="" disabled>
                    Select…
                  </option>
                  {currentTools.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {status === "error" && (
              <p className="mt-4 rounded-xl bg-rose-500/15 px-4 py-3 text-sm font-medium text-rose-300" role="alert">
                {errorMessage ?? waitlistForm.errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "submitting"}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand-400 px-7 py-4 text-base font-bold text-brand-950 shadow-[0_8px_24px_rgba(31,184,99,0.4)] transition hover:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === "submitting" ? (
                <>
                  <Loader2 className="size-5 animate-spin" aria-hidden /> Joining…
                </>
              ) : (
                waitlistForm.submitLabel
              )}
            </button>
            <p className="mt-4 text-center text-xs text-ink-400">
              No spam. We&apos;ll only email you about early access and launch updates.
            </p>
          </form>
        )}
      </div>
    </Section>
  );
}
