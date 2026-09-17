import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { isCompanyEmail } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing point for links in Supabase emails (password recovery, invites).
 * The email templates must link here with token_hash + type, see README.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next");

  const supabase = await createClient();
  const { data, error } =
    tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { data: null, error: new Error("Missing token") };

  const redirectTo = request.nextUrl.clone();
  redirectTo.search = "";

  if (error || !isCompanyEmail(data?.user?.email)) {
    if (!error) await supabase.auth.signOut();
    redirectTo.pathname = "/login";
    redirectTo.searchParams.set("error", "link");
    return NextResponse.redirect(redirectTo);
  }

  // Only same-site paths, so the link can't be used to bounce people to another website.
  redirectTo.pathname = next?.startsWith("/") && !next.startsWith("//") ? next : "/";
  return NextResponse.redirect(redirectTo);
}
