import { type NextRequest, NextResponse } from "next/server";
import { maybeRewriteCustomBookingHost } from "@/lib/booking/custom-host-proxy";
import { isMarketingPath, MARKETING_PAGE_HEADER } from "@/lib/seo/marketing-paths";
import { updateSession } from "@/lib/supabase/proxy";

function withMarketingPageHeader(response: NextResponse, pathname: string): NextResponse {
  if (isMarketingPath(pathname)) {
    response.headers.set(MARKETING_PAGE_HEADER, "1");
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const customRewrite = await maybeRewriteCustomBookingHost(request);
  if (customRewrite) return withMarketingPageHeader(customRewrite, pathname);

  const response = await updateSession(request);
  return withMarketingPageHeader(response, pathname);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|sitemap.xml|robots.txt|llms.txt|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)",
  ],
};
