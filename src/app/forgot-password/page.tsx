import type { Metadata } from "next";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata: Metadata = { title: "Reset password · RFL QR Generator" };

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Reset your password</h1>
      <p className="mb-6 mt-1 text-sm text-zinc-500">
        Enter your work email and we&apos;ll send you a link to choose a new password.
      </p>
      <ForgotPasswordForm />
    </main>
  );
}
