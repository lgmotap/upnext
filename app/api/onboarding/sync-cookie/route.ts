import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ONBOARDING_COOKIE } from "@/lib/onboarding/constants";
import { prisma } from "@/lib/db/prisma";
import { getAppSession } from "@/server/permissions/session";

function safeAppPath(next: string | null): string {
  if (!next || !next.startsWith("/app/") || next.startsWith("//")) {
    return "/app/dashboard";
  }
  return next;
}

/** Sets the onboarding-complete cookie for workspaces already marked in the database. */
export async function GET(request: Request) {
  const session = await getAppSession();
  if (!session) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const profile = await prisma.businessProfile.findUnique({
    where: { organizationId: session.organizationId },
    select: { onboardingCompletedAt: true },
  });

  if (!profile?.onboardingCompletedAt) {
    return NextResponse.redirect(new URL("/app/onboarding", request.url));
  }

  const jar = await cookies();
  jar.set(ONBOARDING_COOKIE, session.organizationId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  const next = safeAppPath(new URL(request.url).searchParams.get("next"));
  return NextResponse.redirect(new URL(next, request.url));
}
