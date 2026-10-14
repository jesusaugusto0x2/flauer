"use client";

import Link from "next/link";
import { useLayoutEffect, useState, useTransition } from "react";
import { removeEntry } from "@/app/actions";
import { CARD_CLASS, KindTag, NoteBody } from "./entry-cards";
import type { EntryKind } from "@/db/schema";

type EntrySummary = {
  id: string;
  kind: EntryKind;
  /** Poems: display title. Notes: their optional title. */
  title: string | null;
  firstLine: string;
  /** Full text, only for notes (they are read on the card). */
  body: string;
};

// Pill colors that read on each kind of paper.
const EDIT_PILL = {
  poem: "pill min-h-[44px] border-ink/30 px-3.5 text-[15px] text-ink-soft hover:bg-ink/5",
  note: "pill min-h-[44px] border-note-ink/30 px-3.5 text-[15px] text-note-ink-soft hover:bg-note-ink/5",
};
const DELETE_PILL =
  "pill min-h-[44px] border-wine/45 px-3.5 text-[15px] text-wine hover:bg-wine/8";

export function WriteList({ date, entries }: { date: string; entries: EntrySummary[] }) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, startTransition] = useTransition();

  // Next keeps this page alive (hidden) after navigating away: close any open
  // delete confirmation so it isn't waiting there on the way back.
  useLayoutEffect(() => {
    return () => {
      setConfirming(null);
      setError(null);
    };
  }, []);

  function remove(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await removeEntry(id);
      if (result.error) setError(result.error);
      else setConfirming(null);
    });
  }

  return (
    <>
      {entries.length === 0 && (
        <p className="mt-6 text-[18px] text-secondary italic">
          Aún no hay nada en este día.
        </p>
      )}

      <ul className="mt-6 flex flex-col gap-3.5">
        {entries.map((e) => {
          const open = confirming === e.id;
          const dimmed = confirming !== null && !open;
          const name =
            e.kind === "poem"
              ? `«${e.title}»`
              : e.title
                ? `la nota «${e.title}»`
                : "la nota";
          return (
            <li
              key={e.id}
              className={`${CARD_CLASS[e.kind]} transition-opacity ${dimmed ? "opacity-60" : ""}`}
            >
              <KindTag kind={e.kind} />
              {e.kind === "poem" ? (
                <>
                  <h2 className="text-[26px] leading-[1.15] font-semibold text-ink-title">
                    <Link
                      href={`/poem/${e.id}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {e.title}
                    </Link>
                  </h2>
                  <p className="truncate text-[18px] text-ink-soft italic">
                    {e.firstLine}
                  </p>
                </>
              ) : (
                <NoteBody title={e.title} body={e.body} />
              )}

              {open ? (
                <div
                  id={`confirm-${e.id}`}
                  role="alertdialog"
                  aria-labelledby={`question-${e.id}`}
                  className="mt-2.5 flex flex-wrap items-center gap-2 rounded-[4px] bg-wine/9 px-3 py-2.5"
                >
                  <p
                    id={`question-${e.id}`}
                    className={`basis-full text-[17px] ${e.kind === "poem" ? "text-ink" : "text-note-ink"}`}
                  >
                    {e.kind === "poem"
                      ? "¿Borrar este poema para siempre?"
                      : "¿Borrar esta nota para siempre?"}
                  </p>
                  {error && (
                    <p className="basis-full text-[16px] text-wine" role="alert">
                      {error}
                    </p>
                  )}
                  <button
                    type="button"
                    className="pill pill-wine min-h-[44px] px-4 text-[15px]"
                    disabled={deleting}
                    onClick={() => remove(e.id)}
                  >
                    {deleting ? "Borrando…" : "Sí, borrar"}
                  </button>
                  <button
                    type="button"
                    className={EDIT_PILL[e.kind]}
                    disabled={deleting}
                    autoFocus
                    onClick={() => setConfirming(null)}
                  >
                    No
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 pt-2">
                  <Link
                    href={`/entry/${e.id}/edit`}
                    className={EDIT_PILL[e.kind]}
                    aria-label={`Editar ${name}`}
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    className={DELETE_PILL}
                    aria-label={`Borrar ${name}`}
                    onClick={() => {
                      setError(null);
                      setConfirming(e.id);
                    }}
                  >
                    Borrar
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <Link
        href={`/write?date=${date}`}
        className="mt-5 flex min-h-[54px] w-full items-center justify-center rounded-[4px] border border-dashed border-light/40 text-[19px] text-light hover:bg-light/7"
      >
        + Agregar poema o nota a este día
      </Link>
    </>
  );
}
