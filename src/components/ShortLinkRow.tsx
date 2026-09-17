"use client";

import { useState, useTransition } from "react";
import { createShortLink } from "@/app/shortLinkActions";

export default function ShortLinkRow({
  id,
  label,
  destination,
  host,
  shortUrl,
  onCreated,
}: {
  id: string;
  label: string;
  destination: string;
  host: string;
  shortUrl: string | undefined;
  onCreated: (shortUrl: string) => void;
}) {
  const [customCode, setCustomCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const create = () => {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await createShortLink({ host, destination, customCode });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.reused) setNotice("A short link to this exact URL already existed, so it was reused.");
      setCustomCode("");
      onCreated(result.shortUrl);
    });
  };

  const copy = async () => {
    if (!shortUrl) return;
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-zinc-900">{label}</span>
        <span className="break-all font-mono text-xs text-zinc-500">{destination}</span>
      </div>

      {shortUrl ? (
        <div className="flex items-center justify-between gap-3 rounded-md bg-zinc-50 px-3 py-2">
          <span className="break-all font-mono text-sm text-zinc-900">{shortUrl}</span>
          <button
            type="button"
            onClick={copy}
            className="shrink-0 text-xs font-medium text-zinc-600 hover:text-zinc-900"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor={id} className="sr-only">
            Custom code for {label}
          </label>
          <div className="flex min-w-0 flex-1 items-center rounded-md border border-zinc-300 bg-white text-sm shadow-sm focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-200">
            <span className="shrink-0 pl-3 text-zinc-400">{host}/</span>
            <input
              id={id}
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              placeholder="random, or type a code"
              className="min-w-0 flex-1 bg-transparent py-2 pr-3 text-zinc-900 outline-none placeholder:text-zinc-400"
            />
          </div>
          <button
            type="button"
            onClick={create}
            disabled={pending || !host}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? "Creating…" : "Create short link"}
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
      {notice && <p className="text-xs text-zinc-500">{notice}</p>}
    </div>
  );
}
