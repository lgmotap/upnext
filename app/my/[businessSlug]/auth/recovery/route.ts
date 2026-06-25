import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { serverEnv } from "@/lib/env";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ businessSlug: string }> },
) {
  const { businessSlug } = await context.params;
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL(`/my/${businessSlug}?error=${encodeURIComponent("Invalid recovery link.")}`, origin),
    );
  }

  const env = serverEnv();
  const nextUrl = new URL(`/my/${businessSlug}/set-password`, origin);
  const supabaseResponse = NextResponse.redirect(nextUrl);

  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL(`/my/${businessSlug}?error=${encodeURIComponent("Recovery link expired.")}`, origin),
    );
  }

  return supabaseResponse;
}
