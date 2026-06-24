import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isBackendConfigured, serverEnv } from "@/lib/env";

const USER_TIMEOUT_MS = 1500;
const TIMED_OUT = Symbol("timed_out");

function hasLikelySupabaseSessionCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((cookie) => cookie.name.includes("auth-token") && cookie.value.length > 0);
}

function buildSupabaseClient(request: NextRequest, onRefreshedResponse: (r: NextResponse) => void) {
  const env = serverEnv();
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        const r = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => r.cookies.set(name, value, options));
        onRefreshedResponse(r);
      },
    },
  });
}

async function verifyUser(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const supabase = buildSupabaseClient(request, (r) => {
    supabaseResponse = r;
  });

  const promise = supabase.auth.getUser();
  promise.catch(() => {});

  const result = await Promise.race([
    promise,
    new Promise<typeof TIMED_OUT>((resolve) => setTimeout(() => resolve(TIMED_OUT), USER_TIMEOUT_MS)),
  ]);

  if (result === TIMED_OUT) {
    return { user: null, isStale: false, supabaseResponse };
  }

  const isStale = !!(result.error && result.error.status === 400);
  return { user: result.data.user ?? null, isStale, supabaseResponse };
}

function clearAuthCookies(response: NextResponse, request: NextRequest) {
  request.cookies.getAll().forEach((cookie) => {
    if (cookie.name.includes("auth-token")) {
      response.cookies.delete(cookie.name);
    }
  });
}

function isPublicRoute(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname.startsWith("/book/")) return true;
  if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up") || pathname.startsWith("/forgot-password")) {
    return true;
  }
  if (pathname.startsWith("/accept-invite/")) return true;
  if (pathname.startsWith("/auth/")) return true;
  if (pathname.startsWith("/api/webhooks/")) return true;
  return false;
}

function isAuthPage(pathname: string): boolean {
  return (
    pathname === "/sign-in" ||
    pathname === "/sign-up" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/auth/")
  );
}

function isProtectedAppRoute(pathname: string): boolean {
  return pathname === "/app" || pathname.startsWith("/app/");
}

export async function updateSession(request: NextRequest) {
  if (!isBackendConfigured()) {
    return NextResponse.next({ request });
  }

  const pathname = request.nextUrl.pathname;
  const hasSessionCookie = hasLikelySupabaseSessionCookie(request);
  const isPasswordFlow =
    pathname.startsWith("/auth/callback") || pathname.startsWith("/auth/confirm");

  if (!hasSessionCookie && isProtectedAppRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (!hasSessionCookie) {
    return NextResponse.next({ request });
  }

  if (hasSessionCookie && isAuthPage(pathname) && !isPasswordFlow) {
    const { user, isStale, supabaseResponse } = await verifyUser(request);
    if (user) {
      const redirect = NextResponse.redirect(new URL("/app/dashboard", request.url));
      supabaseResponse.cookies.getAll().forEach((c) => redirect.cookies.set(c.name, c.value));
      return redirect;
    }
    if (isStale) clearAuthCookies(supabaseResponse, request);
    return supabaseResponse;
  }

  if (isProtectedAppRoute(pathname)) {
    const { user, isStale, supabaseResponse } = await verifyUser(request);
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/sign-in";
      url.searchParams.set("next", pathname);
      const redirect = NextResponse.redirect(url);
      if (isStale) clearAuthCookies(redirect, request);
      return redirect;
    }
    return supabaseResponse;
  }

  if (!isPublicRoute(pathname) && hasSessionCookie) {
    // Fail closed for unknown authenticated areas until explicitly opened.
    const { user } = await verifyUser(request);
    if (!user) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
  }

  return NextResponse.next({ request });
}
