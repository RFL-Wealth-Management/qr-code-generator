import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isCompanyEmail, requireEnv } from "@/lib/config";

/** A per-request Supabase client that reads and writes the auth cookies. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_PUBLISHABLE_KEY"), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components can't set cookies; the proxy refreshes the session instead.
        }
      },
    },
  });
}

/** The signed-in company user, or null. Verifies the JWT rather than trusting the cookie. */
export async function getCompanyUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims.email;
  if (!data || !isCompanyEmail(email)) return null;
  return { supabase, id: data.claims.sub, email };
}
