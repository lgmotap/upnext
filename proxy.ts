import { type NextRequest } from "next/server";
import { maybeRewriteCustomBookingHost } from "@/lib/booking/custom-host-proxy";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const customRewrite = await maybeRewriteCustomBookingHost(request);
  if (customRewrite) return customRewrite;
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|sitemap.xml|robots.txt|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
