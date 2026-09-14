"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { buildTrackedUrl, type UtmParams } from "@/lib/buildTrackedUrl";

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

export default function QrGenerator() {
  const [url, setUrl] = useState("");
  const [utm, setUtm] = useState<UtmParams>({
    source: "",
    medium: "",
    campaign: "",
    content: "",
  });
  const [svg, setSvg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => buildTrackedUrl(url, utm), [url, utm]);
  const finalUrl = result.ok ? result.url : null;

  useEffect(() => {
    if (!finalUrl) return;
    let cancelled = false;
    QRCode.toString(finalUrl, { ...QR_OPTIONS, type: "svg" }).then((markup) => {
      if (!cancelled) setSvg(markup);
    });
    return () => {
      cancelled = true;
    };
  }, [finalUrl]);

  // Hide a stale code as soon as the URL becomes empty or invalid.
  const visibleSvg = finalUrl ? svg : null;

  const downloadSvg = () => {
    if (!visibleSvg || !finalUrl) return;
    const blob = new Blob([visibleSvg], { type: "image/svg+xml" });
    const href = URL.createObjectURL(blob);
    download(href, `${filenameFor(finalUrl)}.svg`);
    URL.revokeObjectURL(href);
  };

  const downloadPng = async () => {
    if (!finalUrl) return;
    const dataUrl = await QRCode.toDataURL(finalUrl, { ...QR_OPTIONS, width: PNG_SIZE });
    download(dataUrl, `${filenameFor(finalUrl)}.png`);
  };

  const copyUrl = async () => {
    if (!finalUrl) return;
    await navigator.clipboard.writeText(finalUrl);
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
              fields are left out.
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

        {finalUrl && (
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
            <p className="break-all font-mono text-xs text-zinc-800">{finalUrl}</p>
          </div>
        )}
      </section>
    </div>
  );
}
