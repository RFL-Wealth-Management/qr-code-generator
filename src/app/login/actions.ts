"use server";

import { redirect } from "next/navigation";
import { COMPANY_EMAIL_DOMAIN, isCompanyEmail } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string; email?: string };

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!isCompanyEmail(email)) {
    return { email, error: `Use your @${COMPANY_EMAIL_DOMAIN} email address.` };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Same message for unknown email and wrong password, so the form can't be used to find accounts.
    if (error.code !== "invalid_credentials") console.error("signInWithPassword failed", error);
    return { email, error: "Email or password is incorrect." };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
