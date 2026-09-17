"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { COMPANY_EMAIL_DOMAIN, isCompanyEmail } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { status: "idle" | "sent" | "error"; message?: string };

export async function sendMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!isCompanyEmail(email)) {
    return { status: "error", message: `Use your @${COMPANY_EMAIL_DOMAIN} email address.` };
  }

  const headerList = await headers();
  const origin =
    headerList.get("origin") ??
    `${headerList.get("x-forwarded-proto") ?? "https"}://${headerList.get("host")}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/confirm` },
  });

  if (error) {
    console.error("signInWithOtp failed", error);
    return { status: "error", message: "Couldn't send the sign-in link. Try again in a minute." };
  }
  return { status: "sent", message: email };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
