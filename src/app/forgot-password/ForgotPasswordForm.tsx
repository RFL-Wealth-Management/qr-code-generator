"use client";

import Link from "next/link";
import { useActionState } from "react";
import { COMPANY_EMAIL_DOMAIN } from "@/lib/config";
import { requestPasswordReset, type ForgotPasswordState } from "./actions";

const initialState: ForgotPasswordState = { sent: false };

export default function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  if (state.sent) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
          If that email has an account, a link to reset the password is on its way. The link
          works once and expires after an hour.
        </div>
        <Link href="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
          ← Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-zinc-900">
          Work email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          placeholder={`name@${COMPANY_EMAIL_DOMAIN}`}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
        />
        {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-40"
      >
        {pending ? "Sending…" : "Email me a reset link"}
      </button>
      <Link href="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
        ← Back to sign in
      </Link>
    </form>
  );
}
