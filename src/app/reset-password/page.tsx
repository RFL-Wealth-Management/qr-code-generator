import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCompanyUser } from "@/lib/supabase/server";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata: Metadata = { title: "Choose a password · RFL QR Generator" };

/** Reached from the recovery or invite email, after /auth/confirm has signed the user in. */
export default async function ResetPasswordPage() {
  const user = await getCompanyUser();
  if (!user) redirect("/login?error=link");

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Choose a password</h1>
      <p className="mb-6 mt-1 text-sm text-zinc-500">
        Setting a new password for <span className="text-zinc-900">{user.email}</span>.
      </p>
      <ResetPasswordForm email={user.email} />
    </main>
  );
}
