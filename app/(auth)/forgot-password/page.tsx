import Link from "next/link";

const input =
  "w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-ink-900 ring-1 ring-ink-200 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-400";

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-950">Reset your password</h1>
      <p className="mt-1 text-sm text-ink-500">We'll email you a reset link.</p>

      <form className="mt-6 space-y-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">Email</label>
          <input type="email" placeholder="you@business.com" className={input} />
        </div>
        <button className="flex w-full items-center justify-center rounded-full bg-brand-400 py-2.5 text-sm font-bold text-brand-950 hover:bg-brand-300">
          Send reset link
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        <Link href="/sign-in" className="font-semibold text-brand-700">Back to sign in</Link>
      </p>
    </div>
  );
}
