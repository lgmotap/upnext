import Link from "next/link";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { signInAction } from "@/server/actions/auth";

const input =
  "w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-ink-900 ring-1 ring-ink-200 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-400";

type PageProps = {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
};

export default async function SignInPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-950">Welcome back</h1>
      <p className="mt-1 text-sm text-ink-500">Sign in to your UpNext workspace.</p>

      <AuthAlert error={params.error} message={params.message} />

      <form action={signInAction} className="mt-6 space-y-3">
        <input type="hidden" name="next" value={params.next ?? "/app/dashboard"} />
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">
            Email
          </label>
          <input id="email" name="email" type="email" required autoComplete="email" placeholder="you@business.com" className={input} />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">
            Password
          </label>
          <input id="password" name="password" type="password" required autoComplete="current-password" placeholder="••••••••" className={input} />
        </div>
        <AuthSubmitButton loadingLabel="Signing in…">Sign in</AuthSubmitButton>
      </form>

      <div className="mt-4 flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-ink-500 hover:text-ink-900">
          Forgot password?
        </Link>
        <Link href="/sign-up" className="font-semibold text-brand-700">
          Create account
        </Link>
      </div>
    </div>
  );
}
