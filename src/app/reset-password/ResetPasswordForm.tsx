"use client";

import { useActionState } from "react";
import { updatePassword, type ResetPasswordState } from "./actions";

const initialState: ResetPasswordState = {};

const inputClass =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200";

export default function ResetPasswordForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState(updatePassword, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {/* Lets password managers save the new password against the right account. */}
      <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-zinc-900">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirm" className="text-sm font-medium text-zinc-900">
          Confirm new password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? "reset-error" : undefined}
          className={inputClass}
        />
        {state.error && (
          <p id="reset-error" className="text-xs text-red-600">
            {state.error}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-40"
      >
        {pending ? "Saving…" : "Save password"}
      </button>
    </form>
  );
}
