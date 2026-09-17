"use client";

import { useActionState } from "react";
import { COMPANY_EMAIL_DOMAIN } from "@/lib/config";
import { sendMagicLink, type LoginState } from "./actions";

const initialState: LoginState = { status: "idle" };

export default function LoginForm({ linkError }: { linkError: boolean }) {
  const [state, formAction, pending] = useActionState(sendMagicLink, initialState);

  if (state.status === "sent") {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
        Check <span className="font-medium text-zinc-900">{state.message}</span> for a sign-in
        link. You can close this tab.
      </div>
    );
  }

  const error =
    state.status === "error"
      ? state.message
      : linkError
        ? "That sign-in link is invalid or has expired. Request a new one."
        : null;

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
          autoComplete="email"
          placeholder={`name@${COMPANY_EMAIL_DOMAIN}`}
          aria-invalid={Boolean(error)}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-40"
      >
        {pending ? "Sending…" : "Email me a sign-in link"}
      </button>
    </form>
  );
}
