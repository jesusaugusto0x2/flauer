"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { removePoem } from "@/app/actions";

type PoemSummary = { id: string; title: string; firstLine: string };

export function WriteList({ date, poems }: { date: string; poems: PoemSummary[] }) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, startTransition] = useTransition();

  function remove(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await removePoem(id);
      if (result.error) setError(result.error);
      else setConfirming(null);
    });
  }

  const inkPill = "pill border-ink/30 text-ink hover:bg-ink/5";

  return (
    <>
      {poems.length === 0 && (
        <p className="text-secondary mt-6 text-[18px] italic">
          Aún no hay poemas en este día.
        </p>
      )}

      <ul className="mt-6 flex flex-col gap-5">
        {poems.map((p, i) => {
          const open = confirming === p.id;
          const dimmed = confirming !== null && !open;
          return (
            <li
              key={p.id}
              className={`paper overflow-hidden transition-opacity ${dimmed ? "opacity-60" : ""}`}
            >
              <div className="px-6 pt-4 pb-5">
                <p className="font-hand text-wine text-[20px] leading-8 font-semibold">
                  Poema {i + 1}
                </p>
                <h2 className="text-ink-title text-[26px] leading-8 font-semibold">
                  <Link
                    href={`/poem/${p.id}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {p.title}
                  </Link>
                </h2>
                <p className="text-ink-soft truncate text-[18px] leading-8 italic">
                  {p.firstLine}
                </p>
                <div className="mt-3 flex gap-3">
                  <Link
                    href={`/poem/${p.id}/edit`}
                    className={inkPill}
                    aria-label={`Editar «${p.title}»`}
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    className="pill border-wine text-wine hover:bg-wine/8"
                    aria-label={`Borrar «${p.title}»`}
                    aria-expanded={open}
                    aria-controls={`confirm-${p.id}`}
                    onClick={() => {
                      setError(null);
                      setConfirming(open ? null : p.id);
                    }}
                  >
                    Borrar
                  </button>
                </div>
              </div>

              {open && (
                <div
                  id={`confirm-${p.id}`}
                  role="alertdialog"
                  aria-labelledby={`question-${p.id}`}
                  className="bg-wine/9 px-6 py-4"
                >
                  <p id={`question-${p.id}`} className="text-ink-title text-[18px]">
                    ¿Borrar este poema para siempre?
                  </p>
                  {error && (
                    <p className="text-wine mt-1 text-[16px]" role="alert">
                      {error}
                    </p>
                  )}
                  <div className="mt-3 flex gap-3">
                    <button
                      type="button"
                      className="pill pill-wine"
                      disabled={deleting}
                      onClick={() => remove(p.id)}
                    >
                      {deleting ? "Borrando…" : "Sí, borrar"}
                    </button>
                    <button
                      type="button"
                      className={inkPill}
                      disabled={deleting}
                      autoFocus
                      onClick={() => setConfirming(null)}
                    >
                      No
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <Link
        href={`/write?date=${date}`}
        className="border-soft-border text-light hover:bg-light/7 mt-6 flex min-h-[52px] w-full items-center justify-center rounded-full border border-dashed text-[17px]"
      >
        {poems.length === 0
          ? "+ Escribir un poema para este día"
          : "+ Agregar otro poema a este día"}
      </Link>
    </>
  );
}
