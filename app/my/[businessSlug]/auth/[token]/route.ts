import { NextResponse } from "next/server";
import { setPortalSessionCookie } from "@/lib/portal/session";
import { verifyCustomerPortalMagicLink } from "@/server/services/customer-portal";

export async function GET(
  request: Request,
  context: { params: Promise<{ businessSlug: string; token: string }> },
) {
  const { businessSlug, token } = await context.params;
  const result = await verifyCustomerPortalMagicLink(businessSlug, token);
  const base = new URL(request.url);

  if (!result.ok) {
    base.pathname = `/my/${businessSlug}`;
    base.search = `error=${encodeURIComponent(result.error)}`;
    return NextResponse.redirect(base);
  }

  await setPortalSessionCookie(result.session);
  base.pathname = `/my/${businessSlug}/dashboard`;
  base.search = "";
  return NextResponse.redirect(base);
}
