import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { isCompanyEmail } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

/** Landing point for the magic link email. Exchanges the link for a session cookie. */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  const { data, error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { data: null, error: new Error("Missing code") };

  const redirectTo = request.nextUrl.clone();
  redirectTo.search = "";

  if (error || !isCompanyEmail(data?.user?.email)) {
    if (!error) await supabase.auth.signOut();
    redirectTo.pathname = "/login";
    redirectTo.searchParams.set("error", "link");
    return NextResponse.redirect(redirectTo);
  }

  redirectTo.pathname = "/";
  return NextResponse.redirect(redirectTo);
}
