"use server";

import { isCompanyEmail } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

export type ForgotPasswordState = { sent: boolean; error?: string };

export async function requestPasswordReset(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  // Report "sent" either way so the form can't be used to discover which accounts exist.
  if (!isCompanyEmail(email)) return { sent: true };

  // The link itself comes from the "Reset Password" email template, which points at /auth/confirm.
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error?.code === "over_email_send_rate_limit") {
    return { sent: false, error: "Too many emails sent. Try again in a few minutes." };
  }
  if (error) console.error("resetPasswordForEmail failed", error);
  return { sent: true };
}
