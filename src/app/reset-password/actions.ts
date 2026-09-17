"use server";

import { redirect } from "next/navigation";
import { getCompanyUser } from "@/lib/supabase/server";

export type ResetPasswordState = { error?: string };

const MIN_LENGTH = 10;

export async function updatePassword(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const user = await getCompanyUser();
  if (!user) return { error: "Your reset link has expired. Request a new one." };

  if (password.length < MIN_LENGTH) {
    return { error: `Use at least ${MIN_LENGTH} characters.` };
  }
  if (password !== confirm) return { error: "The passwords don't match." };

  const { error } = await user.supabase.auth.updateUser({ password });
  if (error?.code === "same_password") {
    return { error: "Choose a password you haven't used for this account." };
  }
  if (error?.code === "weak_password") return { error: error.message };
  if (error) {
    console.error("updateUser failed", error);
    return { error: "Couldn't update the password. Try again." };
  }

  redirect("/");
}
