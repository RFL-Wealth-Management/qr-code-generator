export type UtmParams = {
  source: string;
  medium: string;
  campaign: string;
  content: string;
};

export type BuildResult =
  | { ok: true; url: string }
  | { ok: false; error: string | null };

/**
 * Normalizes a single UTM value before it's added to the URL.
 *
 * Analytics tools (GA4 included) treat UTM values as case-sensitive, so
 * "Newsletter" and "newsletter" show up as two separate sources in reports.
 * This is where the team's naming convention gets enforced.
 */
export function normalizeUtmValue(value: string): string {
  // Casing is handled for the whole URL in buildTrackedUrl().
  // Runs of whitespace become a single "-", e.g. "spring  2026" -> "spring-2026".
  return value.trim().replace(/\s+/g, "-");
}

/** Adds https:// when the protocol is left off, e.g. "example.com/page". */
function withProtocol(raw: string): string {
  return /^[a-z][a-z\d+\-.]*:\/\//i.test(raw) ? raw : `https://${raw}`;
}

export function buildTrackedUrl(rawUrl: string, utm: UtmParams): BuildResult {
  const trimmed = rawUrl.trim();
  if (!trimmed) return { ok: false, error: null };

  let url: URL;
  try {
    url = new URL(withProtocol(trimmed));
  } catch {
    return { ok: false, error: "That doesn't look like a valid URL." };
  }

  if (!url.hostname.includes(".") && url.hostname !== "localhost") {
    return { ok: false, error: "Include a full domain, e.g. example.com." };
  }

  const entries: [keyof UtmParams, string][] = [
    ["source", utm.source],
    ["medium", utm.medium],
    ["campaign", utm.campaign],
    ["content", utm.content],
  ];

  for (const [key, value] of entries) {
    const normalized = normalizeUtmValue(value);
    // set() replaces any utm_* already present in the pasted URL.
    if (normalized) url.searchParams.set(`utm_${key}`, normalized);
  }

  // Force lowercase so the same link always produces the same QR code and
  // analytics don't split "Newsletter" and "newsletter" into separate rows.
  return { ok: true, url: url.toString().toLowerCase() };
}
