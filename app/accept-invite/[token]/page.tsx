import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { acceptTeamInviteAction } from "@/server/actions/team";
import { signUpInviteAction } from "@/server/actions/auth";
import { getTeamInviteByToken } from "@/server/repositories/team-invites";
import { acceptTeamInvite } from "@/server/services/team-invites";
import { getAppSession } from "@/server/permissions/session";

const input =
  "w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-ink-900 ring-1 ring-ink-200 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-400";

export default async function AcceptInvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const invite = await getTeamInviteByToken(token);
  if (!invite) notFound();

  const expired = invite.expiresAt < new Date();
  const accepted = Boolean(invite.acceptedAt);
  const businessName = invite.organization.businessProfile?.displayName ?? invite.organization.name;
  const inviter = invite.invitedBy.user.name ?? invite.invitedBy.user.email;

  const session = await getAppSession();
  if (session && !accepted && !expired) {
    const result = await acceptTeamInvite(token, session.userId, session.email);
    if (result.ok) {
      redirect("/crew");
    }
    if (!query.error) {
      redirect(`/accept-invite/${token}?error=${encodeURIComponent(result.error ?? "Unable to accept invite")}`);
    }
  }

  if (accepted) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-2xl font-bold text-ink-950">Invite already used</h1>
        <p className="mt-2 text-sm text-ink-500">This invite has already been accepted.</p>
        <Link href="/sign-in" className="mt-6 inline-block text-sm font-semibold text-brand-700">
          Sign in
        </Link>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-2xl font-bold text-ink-950">Invite expired</h1>
        <p className="mt-2 text-sm text-ink-500">Ask {businessName} to send a new invite.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold tracking-tight text-ink-950">Join {businessName}</h1>
      <p className="mt-1 text-sm text-ink-500">
        {inviter} invited you as a <span className="font-semibold capitalize">{invite.role}</span>.
      </p>

      <AuthAlert error={query.error} message={query.message} />

      {session ? (
        <form action={acceptTeamInviteAction} className="mt-6">
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="returnTo" value={`/accept-invite/${token}`} />
          <p className="mb-4 text-sm text-ink-600">
            Signed in as <span className="font-semibold">{session.email}</span>
          </p>
          <button
            type="submit"
            className="flex w-full items-center justify-center rounded-full bg-brand-400 py-2.5 text-sm font-bold text-brand-950"
          >
            Accept invite
          </button>
        </form>
      ) : (
        <>
          <form action={signUpInviteAction} className="mt-6 space-y-3">
            <input type="hidden" name="inviteToken" value={token} />
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">
                Your name
              </label>
              <input name="name" required autoComplete="name" className={input} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                readOnly
                defaultValue={invite.email}
                className={`${input} bg-ink-50`}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className={input}
              />
            </div>
            <button
              type="submit"
              className="flex w-full items-center justify-center rounded-full bg-brand-400 py-2.5 text-sm font-bold text-brand-950"
            >
              Create account & join
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-ink-500">
            Already have an account?{" "}
            <Link href={`/sign-in?next=/accept-invite/${token}`} className="font-semibold text-brand-700">
              Sign in
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
