import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Sign in · RFL QR Generator" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">RFL QR Generator</h1>
      <p className="mb-6 mt-1 text-sm text-zinc-500">Sign in to create QR codes and short links.</p>
      <LoginForm linkError={error === "link"} />
    </main>
  );
}
