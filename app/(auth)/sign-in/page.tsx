import Link from "next/link";

const input =
  "w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-ink-900 ring-1 ring-ink-200 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-400";

export default function SignInPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-950">Welcome back</h1>
      <p className="mt-1 text-sm text-ink-500">Sign in to your UpNext workspace.</p>

      <form className="mt-6 space-y-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">Email</label>
          <input type="email" placeholder="you@business.com" className={input} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">Password</label>
          <input type="password" placeholder="••••••••" className={input} />
        </div>
        <Link
          href="/app/dashboard"
          className="flex w-full items-center justify-center rounded-full bg-brand-400 py-2.5 text-sm font-bold text-brand-950 hover:bg-brand-300"
        >
          Sign in
        </Link>
      </form>

      <div className="mt-4 flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-ink-500 hover:text-ink-900">Forgot password?</Link>
        <Link href="/sign-up" className="font-semibold text-brand-700">Create account</Link>
      </div>
    </div>
  );
}
