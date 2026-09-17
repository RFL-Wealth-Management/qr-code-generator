import { redirect } from "next/navigation";
import QrGenerator from "@/components/QrGenerator";
import { getShortLinkHosts } from "@/lib/config";
import { getCompanyUser } from "@/lib/supabase/server";
import { signOut } from "./login/actions";

export default async function Home() {
  // The proxy already redirects signed-out visitors; this check is the one that counts.
  const user = await getCompanyUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:py-16">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">RFL QR Generator</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Build a tracked link with UTM parameters and download it as a QR code.
          </p>
        </div>
        <form action={signOut} className="flex items-center gap-3 text-xs text-zinc-500">
          <span>{user.email}</span>
          <button type="submit" className="font-medium text-zinc-600 hover:text-zinc-900">
            Sign out
          </button>
        </form>
      </header>
      <QrGenerator shortLinkHosts={getShortLinkHosts()} />
    </main>
  );
}
