import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getShortLinkFallbackUrl,
  getShortLinkHosts,
  isCompanyEmail,
  requireEnv,
} from "@/lib/config";

const PUBLIC_PATHS = ["/login"];

export async function proxy(request: NextRequest) {
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "")
    .toLowerCase();

  if (getShortLinkHosts().includes(host)) {
    return redirectShortLink(request, host);
  }
  return protectApp(request);
}

/** Short-link hosts only redirect; they never render the generator. */
async function redirectShortLink(request: NextRequest, host: string) {
  const code = request.nextUrl.pathname.replace(/^\/+|\/+$/g, "").toLowerCase();
  let destination: string | null = null;

  if (code) {
    const supabase = createServerClient(
      requireEnv("SUPABASE_URL"),
      requireEnv("SUPABASE_PUBLISHABLE_KEY"),
      { cookies: { getAll: () => [], setAll: () => {} } },
    );
    const { data, error } = await supabase.rpc("resolve_short_link", {
      p_host: host,
      p_code: code,
    });
    if (error) console.error("resolve_short_link failed", error);
    destination = typeof data === "string" ? data : null;
  }

  // 302, not 301: browsers cache 301s forever, which would pin a printed code to its first destination.
  const response = NextResponse.redirect(destination ?? getShortLinkFallbackUrl(), 302);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

/** Refreshes the Supabase session cookie and keeps non-company visitors on the login page. */
async function protectApp(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_PUBLISHABLE_KEY"),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );

  // getClaims() verifies the JWT and refreshes an expired session via setAll above.
  const { data } = await supabase.auth.getClaims();
  const isPublic = PUBLIC_PATHS.some((path) => request.nextUrl.pathname.startsWith(path));

  if (!isPublic && !isCompanyEmail(data?.claims.email)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
