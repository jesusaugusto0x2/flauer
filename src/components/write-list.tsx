"use client";

import Link from "next/link";
import { useLayoutEffect, useState, useTransition } from "react";
import { removeEntry } from "@/app/actions";
import type { EntryKind } from "@/db/schema";
import { displayTitle, firstLine } from "@/lib/kinds";
import {
  CARD_LAYOUT,
  KIND_THEME,
  KindTag,
  SpotifyLink,
  type EntrySummary,
} from "./entry-cards";

const PILL = "pill min-h-11 px-3.5 text-[15px]";
const DELETE_PILL = `${PILL} border-wine/45 text-wine hover:bg-wine/8`;

const QUESTION: Record<EntryKind, string> = {
  poem: "¿Borrar este poema para siempre?",
  note: "¿Borrar esta nota para siempre?",
  song: "¿Borrar esta canción para siempre?",
};

/** How the entry is named in "Editar …" / "Borrar …" labels. */
function accessibleName(entry: EntrySummary) {
  const title = entry.title?.trim();
  if (entry.kind === "poem") return `«${displayTitle(entry)}»`;
  if (entry.kind === "song") return `la canción «${displayTitle(entry)}»`;
  return title ? `la nota «${title}»` : "la nota";
}

export function WriteList({
  date,
  entries,
  listClassName = "",
}: {
  date: string;
  entries: EntrySummary[];
  /** Extra classes for the list, e.g. to make it scroll inside its column. */
  listClassName?: string;
}) {
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

      {entries.length > 0 && (
        <ul className={`mt-6 flex flex-col gap-3.5 lg:mt-4 lg:gap-4 ${listClassName}`}>
          {entries.map((e) => {
            const theme = KIND_THEME[e.kind];
            const open = confirming === e.id;
            const dimmed = confirming !== null && !open;
            const name = accessibleName(e);
            return (
              <li
                key={e.id}
                className={`${theme.paper} ${CARD_LAYOUT} transition-opacity ${dimmed ? "opacity-60" : ""}`}
              >
                <KindTag kind={e.kind} />
                <EntryContent entry={e} />

                {open ? (
                  <div
                    id={`confirm-${e.id}`}
                    role="alertdialog"
                    aria-labelledby={`question-${e.id}`}
                    className="mt-2.5 flex flex-wrap items-center gap-2 rounded-[4px] bg-wine/9 px-3 py-2.5"
                  >
                    <p
                      id={`question-${e.id}`}
                      className={`basis-full text-[17px] ${theme.text}`}
                    >
                      {QUESTION[e.kind]}
                    </p>
                    {error && (
                      <p className="basis-full text-[16px] text-wine" role="alert">
                        {error}
                      </p>
                    )}
                    <button
                      type="button"
                      className={`${PILL} pill-wine px-4`}
                      disabled={deleting}
                      onClick={() => remove(e.id)}
                    >
                      {deleting ? "Borrando…" : "Sí, borrar"}
                    </button>
                    <button
                      type="button"
                      className={`${PILL} ${theme.pill}`}
                      disabled={deleting}
                      autoFocus
                      onClick={() => setConfirming(null)}
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {e.kind === "song" && e.spotifyUrl && (
                      <SpotifyLink url={e.spotifyUrl} name={displayTitle(e)} compact />
                    )}
                    <Link
                      href={`/entry/${e.id}/edit`}
                      className={`${PILL} ${theme.pill}`}
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
      )}

      <Link
        href={`/write?date=${date}`}
        className="mt-5 flex min-h-[54px] w-full shrink-0 items-center justify-center rounded-[4px] border border-dashed border-light/40 px-4 text-center text-[19px] text-light hover:bg-light/7"
      >
        + Agregar poema, nota o canción a este día
      </Link>
    </>
  );
}

/** The middle of a card in write mode: what the entry is, without its actions. */
function EntryContent({ entry }: { entry: EntrySummary }) {
  const theme = KIND_THEME[entry.kind];
  const link = "underline-offset-4 hover:underline";

  if (entry.kind === "poem") {
    return (
      <>
        <h2 className={`text-[26px] leading-[1.15] font-semibold ${theme.title}`}>
          <Link href={`/entry/${entry.id}`} className={link}>
            {displayTitle(entry)}
          </Link>
        </h2>
        <p className={`truncate text-[18px] italic ${theme.soft}`}>
          {firstLine(entry.body)}
        </p>
      </>
    );
  }

  if (entry.kind === "note") {
    return entry.title ? (
      <>
        <h2 className={`text-[22px] leading-[1.2] font-semibold ${theme.title}`}>
          <Link href={`/entry/${entry.id}`} className={link}>
            {entry.title}
          </Link>
        </h2>
        <p
          className={`line-clamp-3 text-[18px] leading-normal whitespace-pre-line ${theme.text}`}
        >
          {entry.body}
        </p>
      </>
    ) : (
      <Link
        href={`/entry/${entry.id}`}
        className={`line-clamp-3 text-[18px] leading-normal whitespace-pre-line ${theme.text} ${link}`}
      >
        {entry.body}
      </Link>
    );
  }

  return (
    <>
      <h2 className={`text-[24px] leading-[1.15] font-semibold ${theme.title}`}>
        <Link href={`/entry/${entry.id}`} className={link}>
          {displayTitle(entry)}
        </Link>
      </h2>
      {entry.artist && (
        <p className={`text-[18px] italic ${theme.soft}`}>{entry.artist}</p>
      )}
    </>
  );
}
