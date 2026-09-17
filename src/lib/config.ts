/** Reads a required environment variable, failing loudly when it's missing. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}. See .env.example.`);
  return value;
}

/** Only emails on this domain can sign in and create links. Keep in sync with is_company_user() in SQL. */
export const COMPANY_EMAIL_DOMAIN = "rflwealth.ca";

export function isCompanyEmail(email: unknown): email is string {
  return typeof email === "string" && email.toLowerCase().endsWith(`@${COMPANY_EMAIL_DOMAIN}`);
}

/**
 * Hosts that serve short links, e.g. "events.rflwealth.ca,dinner-seminars.rflwealth.ca".
 * Include the port for local testing, e.g. "events.localhost:3000".
 */
export function getShortLinkHosts(): string[] {
  return (process.env.SHORT_LINK_HOSTS ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
}

/** Where short-link hosts send visitors when the code is missing or unknown. */
export function getShortLinkFallbackUrl(): string {
  return process.env.SHORT_LINK_FALLBACK_URL || "https://rflwealth.ca";
}

export function shortLinkUrl(host: string, code: string): string {
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}/${code}`;
}
