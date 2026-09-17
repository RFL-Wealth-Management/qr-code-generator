"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { buildTrackedUrl, type UtmParams } from "@/lib/buildTrackedUrl";
import ShortLinkRow from "@/components/ShortLinkRow";

type FieldConfig = {
  id: string;
  label: string;
  description: string;
  example: string;
  required?: boolean;
};

const URL_FIELD: FieldConfig = {
  id: "url",
  label: "URL",
  description: "The page people land on after scanning the code.",
  example: "https://example.com/spring-offer",
  required: true,
};

const UTM_FIELDS: (FieldConfig & { key: keyof UtmParams })[] = [
  {
    key: "source",
    id: "utm_source",
    label: "Source",
    description: "Where the traffic comes from — the referrer, publication or platform.",
    example: "newsletter, linkedin, flyer",
  },
  {
    key: "medium",
    id: "utm_medium",
    label: "Medium",
    description: "The marketing channel or type of placement.",
    example: "email, social, print, qr",
  },
  {
    key: "campaign",
    id: "utm_campaign",
    label: "Campaign",
    description: "The name of the campaign or promotion this belongs to.",
    example: "spring_2026, rrsp_season",
  },
  {
    key: "content",
    id: "utm_content",
    label: "Content",
    description:
      "Differentiates variations within one campaign, e.g. which ad or placement was scanned.",
    example: "header_banner, back_cover",
  },
];

const QR_OPTIONS = {
  errorCorrectionLevel: "M" as const,
  margin: 2,
  color: { dark: "#000000", light: "#ffffff" },
};

const PNG_SIZE = 1024;

const NO_UTM: UtmParams = { source: "", medium: "", campaign: "", content: "" };

// Short links are remembered per subdomain + destination, so editing a field hides
// links that no longer match and changing it back shows them again.
const shortLinkKey = (host: string, destination: string) => `${host} ${destination}`;

function Field({
  config,
  value,
  onChange,
  error,
}: {
  config: FieldConfig;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
}) {
  const hintId = `${config.id}-hint`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={config.id} className="text-sm font-medium text-zinc-900">
        {config.label}
        {config.required && <span className="ml-0.5 text-red-600">*</span>}
      </label>
      <input
        id={config.id}
        type="text"
        inputMode={config.id === "url" ? "url" : "text"}
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={config.example.split(",")[0]}
        aria-describedby={hintId}
        aria-invalid={Boolean(error)}
        className={`rounded-md border bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:ring-2 ${
          error
            ? "border-red-400 focus:border-red-500 focus:ring-red-200"
            : "border-zinc-300 focus:border-zinc-500 focus:ring-zinc-200"
        }`}
      />
      <p id={hintId} className="text-xs leading-relaxed text-zinc-500">
        {error ? (
          <span className="text-red-600">{error}</span>
        ) : (
          <>
            {config.description}{" "}
            <span className="text-zinc-400">
              Example: <code className="font-mono">{config.example}</code>
            </span>
          </>
        )}
      </p>
    </div>
  );
}

function download(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function filenameFor(url: string) {
  try {
    const { hostname } = new URL(url);
    return `qr-${hostname.replace(/^www\./, "").replace(/[^a-z0-9]+/gi, "-")}`;
  } catch {
    return "qr-code";
  }
}

export default function QrGenerator({ shortLinkHosts }: { shortLinkHosts: string[] }) {
  const [url, setUrl] = useState("");
  const [utm, setUtm] = useState<UtmParams>({
    source: "",
    medium: "",
    campaign: "",
    content: "",
  });
  const [svg, setSvg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shortHost, setShortHost] = useState(shortLinkHosts[0] ?? "");
  const [shortLinks, setShortLinks] = useState<Record<string, string>>({});
  const [qrUsesShortLink, setQrUsesShortLink] = useState(true);

  const result = useMemo(() => buildTrackedUrl(url, utm), [url, utm]);
  const finalUrl = result.ok ? result.url : null;
  const plainResult = useMemo(() => buildTrackedUrl(url, NO_UTM), [url]);
  const plainUrl = plainResult.ok ? plainResult.url : null;
  const hasUtm = Boolean(finalUrl && plainUrl && finalUrl !== plainUrl);

  const trackedShortUrl = finalUrl ? shortLinks[shortLinkKey(shortHost, finalUrl)] : undefined;
  const plainShortUrl = plainUrl ? shortLinks[shortLinkKey(shortHost, plainUrl)] : undefined;
  const saveShortLink = (destination: string) => (shortUrl: string) =>
    setShortLinks((prev) => ({ ...prev, [shortLinkKey(shortHost, destination)]: shortUrl }));

  // What the QR code contains: the tracked URL, or its short link once one exists.
  const qrValue = finalUrl && qrUsesShortLink && trackedShortUrl ? trackedShortUrl : finalUrl;

  useEffect(() => {
    if (!qrValue) return;
    let cancelled = false;
    QRCode.toString(qrValue, { ...QR_OPTIONS, type: "svg" }).then((markup) => {
      if (!cancelled) setSvg(markup);
    });
    return () => {
      cancelled = true;
    };
  }, [qrValue]);

  // Hide a stale code as soon as the URL becomes empty or invalid.
  const visibleSvg = qrValue ? svg : null;

  const downloadSvg = () => {
    if (!visibleSvg || !finalUrl) return;
    const blob = new Blob([visibleSvg], { type: "image/svg+xml" });
    const href = URL.createObjectURL(blob);
    download(href, `${filenameFor(finalUrl)}.svg`);
    URL.revokeObjectURL(href);
  };

  const downloadPng = async () => {
    if (!finalUrl || !qrValue) return;
    const dataUrl = await QRCode.toDataURL(qrValue, { ...QR_OPTIONS, width: PNG_SIZE });
    download(dataUrl, `${filenameFor(finalUrl)}.png`);
  };

  const copyUrl = async () => {
    if (!qrValue) return;
    await navigator.clipboard.writeText(qrValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const buttonClass =
    "flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
      {/* Fields */}
      <section className="flex flex-col gap-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <Field
          config={URL_FIELD}
          value={url}
          onChange={setUrl}
          error={result.ok ? null : result.error}
        />

        <fieldset className="flex flex-col gap-5 border-t border-zinc-200 pt-6">
          <legend className="sr-only">UTM parameters</legend>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">UTM parameters</h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              Optional tags appended to the URL so analytics tools can attribute scans. Empty
              fields are left out, spaces become &quot;-&quot;, and the final URL is converted to
              lowercase.
            </p>
          </div>
          {UTM_FIELDS.map((field) => (
            <Field
              key={field.key}
              config={field}
              value={utm[field.key]}
              onChange={(value) => setUtm((prev) => ({ ...prev, [field.key]: value }))}
            />
          ))}
        </fieldset>

        <fieldset className="flex flex-col gap-4 border-t border-zinc-200 pt-6">
          <legend className="sr-only">Short links</legend>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Short links</h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              Leave the code empty for a random one, or type a readable code. Once a code is
              printed, treat it as permanent.
            </p>
          </div>

          {shortLinkHosts.length === 0 ? (
            <p className="text-xs text-red-600">
              No short-link subdomains are configured. Set SHORT_LINK_HOSTS in the environment.
            </p>
          ) : (
            <>
              {shortLinkHosts.length > 1 && (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="short_host" className="text-sm font-medium text-zinc-900">
                    Subdomain
                  </label>
                  <select
                    id="short_host"
                    value={shortHost}
                    onChange={(e) => setShortHost(e.target.value)}
                    className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                  >
                    {shortLinkHosts.map((host) => (
                      <option key={host} value={host}>
                        {host}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!finalUrl || !plainUrl ? (
                <p className="text-xs text-zinc-400">Enter a URL to create short links.</p>
              ) : (
                <>
                  {hasUtm && (
                    <ShortLinkRow
                      key={shortLinkKey(shortHost, finalUrl)}
                      id="short_tracked"
                      label="Tracked URL (with UTMs)"
                      destination={finalUrl}
                      host={shortHost}
                      shortUrl={trackedShortUrl}
                      onCreated={saveShortLink(finalUrl)}
                    />
                  )}
                  <ShortLinkRow
                    key={shortLinkKey(shortHost, plainUrl)}
                    id="short_plain"
                    label={hasUtm ? "Main URL (without UTMs)" : "URL"}
                    destination={plainUrl}
                    host={shortHost}
                    shortUrl={plainShortUrl}
                    onCreated={saveShortLink(plainUrl)}
                  />
                </>
              )}
            </>
          )}
        </fieldset>
      </section>

      {/* QR preview */}
      <section className="flex flex-col gap-4 lg:sticky lg:top-8 lg:self-start">
        <div className="flex aspect-square items-center justify-center rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          {visibleSvg ? (
            <div
              className="h-full w-full [&>svg]:h-full [&>svg]:w-full"
              // Markup comes from the qrcode library, not from user input.
              dangerouslySetInnerHTML={{ __html: visibleSvg }}
              role="img"
              aria-label="Generated QR code"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-200 text-center">
              <span className="text-sm font-medium text-zinc-500">No QR code yet</span>
              <span className="px-6 text-xs text-zinc-400">Enter a URL to generate one.</span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={downloadSvg}
            disabled={!visibleSvg}
            className={`${buttonClass} bg-zinc-900 text-white hover:bg-zinc-700`}
          >
            Download SVG
          </button>
          <button
            type="button"
            onClick={downloadPng}
            disabled={!visibleSvg}
            className={`${buttonClass} border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50`}
          >
            Download PNG
          </button>
        </div>

        {trackedShortUrl && (
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={qrUsesShortLink}
              onChange={(e) => setQrUsesShortLink(e.target.checked)}
              className="h-4 w-4 accent-zinc-900"
            />
            Put the short link in the QR code
          </label>
        )}

        {qrValue && (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500">Encoded URL</span>
              <button
                type="button"
                onClick={copyUrl}
                className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="break-all font-mono text-xs text-zinc-800">{qrValue}</p>
          </div>
        )}
      </section>
    </div>
  );
}
