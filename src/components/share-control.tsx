"use client";

import { useState, useTransition } from "react";
import { shareItem, unshareItem } from "@/app/actions";
import type { ShareTarget } from "@/lib/shares";

const PILL = "pill px-4 text-[15px] lg:text-[16px]";

/**
 * Write mode: a short link that opens this poem, note or video (and only it)
 * without the reader's password, to copy and send. "Dejar de compartir" turns it off.
 */
export function ShareControl({
  target,
  code: savedCode,
  origin,
}: {
  target: ShareTarget;
  /** The link it already has, if any. */
  code: string | null;
  /** "https://flauer.app": where the link points. */
  origin: string;
}) {
  const [code, setCode] = useState(savedCode);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  function share() {
    setError(null);
    startTransition(async () => {
      const result = await shareItem(target);
      if (result.code) setCode(result.code);
      else setError(result.error ?? null);
    });
  }

  function stop() {
    setError(null);
    startTransition(async () => {
      const result = await unshareItem(target);
      if (result.error) {
        setError(result.error);
      } else {
        setCode(null);
        setCopied(false);
      }
    });
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // No clipboard (an old browser, or not allowed): the field can still be copied.
    }
  }

  const errorText = error && (
    <p role="alert" className="text-[16px] text-pink">
      {error}
    </p>
  );

  if (!code) {
    return (
      <div className="flex flex-col items-start gap-2">
        <button type="button" className={PILL} disabled={busy} onClick={share}>
          {busy ? "Creando enlace…" : "Compartir"}
        </button>
        {errorText}
      </div>
    );
  }

  const url = `${origin}/c/${code}`;
  return (
    <div className="flex flex-col gap-2.5 rounded-[10px] bg-light/8 px-3.5 py-3">
      <p className="text-[16px] text-secondary">
        Quien abra este enlace lo verá sin la clave:
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          readOnly
          value={url}
          aria-label="Enlace para compartir"
          onFocus={(e) => e.currentTarget.select()}
          className="min-h-11 min-w-0 flex-[1_1_220px] rounded-full border border-soft-border bg-night/70 px-4 text-[16px] text-light"
        />
        <button type="button" className={PILL} onClick={() => copy(url)}>
          {copied ? "¡Copiado!" : "Copiar"}
        </button>
        <button
          type="button"
          className={`${PILL} border-pink/45 text-pink hover:bg-pink/8`}
          disabled={busy}
          onClick={stop}
        >
          Dejar de compartir
        </button>
      </div>
      {errorText}
    </div>
  );
}
