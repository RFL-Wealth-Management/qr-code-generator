"use client";

import Link from "next/link";
import { useActionState } from "react";
import { COMPANY_EMAIL_DOMAIN } from "@/lib/config";
import { signIn, type LoginState } from "./actions";

const initialState: LoginState = {};

const inputClass =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200";

export default function LoginForm({ linkError }: { linkError: boolean }) {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {linkError && !state.error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          That link is invalid or has expired.{" "}
          <Link href="/forgot-password" className="font-medium underline">
            Request a new one
          </Link>
          .
        </p>
      )}
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
          defaultValue={state.email}
          placeholder={`name@${COMPANY_EMAIL_DOMAIN}`}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <label htmlFor="password" className="text-sm font-medium text-zinc-900">
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
          >
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? "login-error" : undefined}
          className={inputClass}
        />
        {state.error && (
          <p id="login-error" className="text-xs text-red-600">
            {state.error}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-40"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
