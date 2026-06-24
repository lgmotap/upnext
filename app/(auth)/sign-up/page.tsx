import Link from "next/link";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { signUpAction } from "@/server/actions/auth";

const input =
  "w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-ink-900 ring-1 ring-ink-200 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-400";

type PageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function SignUpPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-950">Start your free workspace</h1>
      <p className="mt-1 text-sm text-ink-500">Set up your business in a few minutes.</p>

      <AuthAlert error={params.error} message={params.message} />

      <form action={signUpAction} className="mt-6 space-y-3">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">
            Your name
          </label>
          <input id="name" name="name" required autoComplete="name" placeholder="Alex Rivera" className={input} />
        </div>
        <div>
          <label htmlFor="businessName" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">
            Business name
          </label>
          <input id="businessName" name="businessName" required placeholder="Sparkle & Shine Cleaning Co." className={input} />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">
            Work email
          </label>
          <input id="email" name="email" type="email" required autoComplete="email" placeholder="you@business.com" className={input} />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">
            Password
          </label>
          <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="••••••••" className={input} />
        </div>
        <AuthSubmitButton loadingLabel="Creating workspace…">Create workspace</AuthSubmitButton>
      </form>

      <p className="mt-4 text-center text-sm text-ink-500">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-semibold text-brand-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
