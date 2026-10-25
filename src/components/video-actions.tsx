"use client";

import Link from "next/link";
import { useLayoutEffect, useState, useTransition } from "react";
import { removeVideo } from "@/app/actions";

const PILL = "pill px-4 text-[15px] lg:text-[16px]";

/** Write mode, on a video's page: Editar, and Borrar once confirmed right here. */
export function VideoActions({ id, sourceName }: { id: string; sourceName: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, startTransition] = useTransition();

  // Next keeps this page alive (hidden) after leaving it: don't come back to the
  // question still open.
  useLayoutEffect(() => {
    return () => {
      setConfirming(false);
      setError(null);
    };
  }, []);

  function remove() {
    setError(null);
    startTransition(async () => {
      // Once it's gone, the server takes us back to the list.
      const result = await removeVideo(id);
      if (result?.error) setError(result.error);
    });
  }

  if (!confirming) {
    return (
      <>
        <Link href={`/videos/${id}/edit`} className={PILL}>
          Editar
        </Link>
        <button
          type="button"
          className={`${PILL} border-pink/45 text-pink hover:bg-pink/8`}
          onClick={() => {
            setError(null);
            setConfirming(true);
          }}
        >
          Borrar
        </button>
      </>
    );
  }

  return (
    <div
      role="alertdialog"
      aria-labelledby={`delete-${id}`}
      className="flex basis-full flex-wrap items-center gap-2 rounded-[10px] bg-light/8 px-3.5 py-3"
    >
      <p id={`delete-${id}`} className="basis-full text-[17px]">
        ¿Borrar este video del diario? En {sourceName} sigue guardado.
      </p>
      {error && (
        <p role="alert" className="basis-full text-[16px] text-pink">
          {error}
        </p>
      )}
      <button
        type="button"
        className={`${PILL} pill-wine`}
        disabled={deleting}
        onClick={remove}
      >
        {deleting ? "Borrando…" : "Sí, borrar"}
      </button>
      <button
        type="button"
        className={PILL}
        disabled={deleting}
        autoFocus
        onClick={() => setConfirming(false)}
      >
        No
      </button>
    </div>
  );
}
