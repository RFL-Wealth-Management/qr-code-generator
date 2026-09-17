"use server";

import { getShortLinkHosts, shortLinkUrl } from "@/lib/config";
import {
  normalizeCustomCode,
  randomShortCode,
  SHORT_CODE_MAX,
  SHORT_CODE_MIN,
  SHORT_CODE_PATTERN,
} from "@/lib/shortCode";
import { getCompanyUser } from "@/lib/supabase/server";

export type CreateShortLinkResult =
  | { ok: true; shortUrl: string; reused: boolean }
  | { ok: false; error: string };

const UNIQUE_VIOLATION = "23505";
const RANDOM_ATTEMPTS = 5;

export async function createShortLink(input: {
  host: string;
  destination: string;
  customCode?: string;
}): Promise<CreateShortLinkResult> {
  // Server Functions are reachable by direct POST, so re-check everything here.
  const user = await getCompanyUser();
  if (!user) return { ok: false, error: "Your session expired. Reload and sign in again." };

  const host = input.host.toLowerCase();
  if (!getShortLinkHosts().includes(host)) {
    return { ok: false, error: "That subdomain isn't set up for short links." };
  }

  if (!/^https?:\/\//.test(input.destination) || !URL.canParse(input.destination)) {
    return { ok: false, error: "The destination isn't a valid URL." };
  }
  const { supabase } = user;

  const customCode = input.customCode ? normalizeCustomCode(input.customCode) : "";
  if (customCode) {
    if (
      customCode.length < SHORT_CODE_MIN ||
      customCode.length > SHORT_CODE_MAX ||
      !SHORT_CODE_PATTERN.test(customCode)
    ) {
      return {
        ok: false,
        error: `Use ${SHORT_CODE_MIN}–${SHORT_CODE_MAX} lowercase letters and numbers, separated by single hyphens.`,
      };
    }

    const { error } = await supabase
      .from("short_links")
      .insert({ host, code: customCode, destination: input.destination });

    if (error?.code === UNIQUE_VIOLATION) {
      return { ok: false, error: `${shortLinkUrl(host, customCode)} is already taken.` };
    }
    if (error) return failed(error);
    return { ok: true, shortUrl: shortLinkUrl(host, customCode), reused: false };
  }

  // Without a custom code, reuse an existing link to the same destination instead of piling up duplicates.
  const { data: existing, error: lookupError } = await supabase
    .from("short_links")
    .select("code")
    .eq("host", host)
    .eq("destination", input.destination)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (lookupError) return failed(lookupError);
  if (existing) return { ok: true, shortUrl: shortLinkUrl(host, existing.code), reused: true };

  for (let attempt = 0; attempt < RANDOM_ATTEMPTS; attempt++) {
    const code = randomShortCode();
    const { error } = await supabase
      .from("short_links")
      .insert({ host, code, destination: input.destination });
    if (!error) return { ok: true, shortUrl: shortLinkUrl(host, code), reused: false };
    if (error.code !== UNIQUE_VIOLATION) return failed(error);
  }
  return { ok: false, error: "Couldn't find a free code. Try again." };
}

function failed(error: unknown): CreateShortLinkResult {
  console.error("createShortLink failed", error);
  return { ok: false, error: "Couldn't save the short link. Try again." };
}
