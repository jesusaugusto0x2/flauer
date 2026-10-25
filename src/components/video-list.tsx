"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { removeVideo } from "@/app/actions";
import type { VideoSource } from "@/db/schema";
import { SOURCE_NAME } from "@/lib/video-links";
import { PlayIcon } from "./icons";

export type VideoSummary = {
  id: string;
  title: string;
  note: string | null;
  source: VideoSource;
  /** "25 de octubre de 2026": the day it was added, formatted on the server. */
  dateLabel: string;
};

const CARD = "flex gap-3.5 rounded-[12px] px-4 py-3.5 transition-opacity";
const CURRENT = "bg-light/14 ring-1 ring-light/45 ring-inset";
const PILL = "pill min-h-11 px-3.5 text-[15px]";

/**
 * The videos, the newest first. Reading: each card opens its video. Writing:
 * the title opens it, with Editar and Borrar (confirmed in the card) below.
 */
export function VideoList({
  videos,
  currentId,
  writing,
  className = "",
}: {
  videos: VideoSummary[];
  /** The video being watched, if any. */
  currentId?: string;
  writing: boolean;
  className?: string;
}) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, startTransition] = useTransition();
  const currentItem = useRef<HTMLLIElement>(null);

  // A long list starts at the top: bring the video being watched into view.
  useEffect(() => {
    currentItem.current?.scrollIntoView({ block: "nearest" });
  }, [currentId]);

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
      // Deleting the video on screen leaves its page for the list.
      const result = await removeVideo(id, id === currentId);
      if (result?.error) setError(result.error);
      else setConfirming(null);
    });
  }

  return (
    <ul className={`flex flex-col gap-3 ${className}`}>
      {videos.map((v) => {
        const current = v.id === currentId;
        if (!writing) {
          return (
            <li key={v.id} ref={current ? currentItem : undefined}>
              <Link
                href={`/videos/${v.id}`}
                aria-current={current ? "page" : undefined}
                className={`${CARD} ${current ? CURRENT : "bg-light/7 hover:bg-light/12"}`}
              >
                <Summary video={v} />
              </Link>
            </li>
          );
        }

        const open = confirming === v.id;
        const dimmed = confirming !== null && !open;
        return (
          <li
            key={v.id}
            ref={current ? currentItem : undefined}
            className={`${CARD} flex-col ${current ? CURRENT : "bg-light/7"} ${dimmed ? "opacity-60" : ""}`}
          >
            <div className="flex gap-3.5">
              <Summary
                video={v}
                link={current ? undefined : `/videos/${v.id}`}
                withSource
              />
            </div>
            {open ? (
              <div
                role="alertdialog"
                aria-labelledby={`question-${v.id}`}
                className="flex flex-wrap items-center gap-2 rounded-[8px] bg-light/8 px-3 py-2.5"
              >
                <p id={`question-${v.id}`} className="basis-full text-[17px]">
                  ¿Borrar este video del diario? En {SOURCE_NAME[v.source]} sigue
                  guardado.
                </p>
                {error && (
                  <p className="basis-full text-[16px] text-pink" role="alert">
                    {error}
                  </p>
                )}
                <button
                  type="button"
                  className={`${PILL} pill-wine px-4`}
                  disabled={deleting}
                  onClick={() => remove(v.id)}
                >
                  {deleting ? "Borrando…" : "Sí, borrar"}
                </button>
                <button
                  type="button"
                  className={PILL}
                  disabled={deleting}
                  autoFocus
                  onClick={() => setConfirming(null)}
                >
                  No
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 pl-[54px]">
                <Link
                  href={`/videos/${v.id}/edit`}
                  className={PILL}
                  aria-label={`Editar el video «${v.title}»`}
                >
                  Editar
                </Link>
                <button
                  type="button"
                  className={`${PILL} border-pink/45 text-pink hover:bg-pink/8`}
                  aria-label={`Borrar el video «${v.title}»`}
                  onClick={() => {
                    setError(null);
                    setConfirming(v.id);
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
  );
}

/** Play badge, title, date and the start of the note. */
function Summary({
  video,
  link,
  withSource = false,
}: {
  video: VideoSummary;
  /** Writing: the title alone is the link (the card holds buttons). */
  link?: string;
  withSource?: boolean;
}) {
  return (
    <>
      <span
        aria-hidden="true"
        className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full border border-light/35 text-light"
      >
        <PlayIcon size={13} className="ml-0.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[21px] leading-[1.2] font-semibold break-words">
          {link ? (
            <Link href={link} className="underline-offset-4 hover:underline">
              {video.title}
            </Link>
          ) : (
            video.title
          )}
        </span>
        <span className="mt-0.5 block text-[16px] text-secondary italic">
          {video.dateLabel}
          {withSource && ` · ${SOURCE_NAME[video.source]}`}
        </span>
        {video.note && (
          <span className="mt-1.5 line-clamp-2 text-[17px] leading-snug whitespace-pre-line text-light/80">
            {video.note}
          </span>
        )}
      </span>
    </>
  );
}
