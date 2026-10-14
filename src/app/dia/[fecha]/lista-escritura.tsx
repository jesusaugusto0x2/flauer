"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { eliminarPoema } from "@/app/acciones";

type Resumen = { id: string; titulo: string; verso: string };

export function ListaEscritura({ fecha, poemas }: { fecha: string; poemas: Resumen[] }) {
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [borrando, startTransition] = useTransition();

  function borrar(id: string) {
    setError(null);
    startTransition(async () => {
      const resultado = await eliminarPoema(id);
      if (resultado.error) setError(resultado.error);
      else setConfirmando(null);
    });
  }

  return (
    <>
      {poemas.length === 0 && (
        <p className="text-secundario mt-6 text-[18px] italic">
          Aún no hay poemas en este día.
        </p>
      )}

      <ul className="mt-6 flex flex-col gap-5">
        {poemas.map((p, i) => {
          const abierta = confirmando === p.id;
          const atenuada = confirmando !== null && !abierta;
          return (
            <li
              key={p.id}
              className={`papel overflow-hidden transition-opacity ${atenuada ? "opacity-60" : ""}`}
            >
              <div className="px-6 pt-4 pb-5">
                <p className="font-mano text-vino text-[20px] leading-8 font-semibold">
                  Poema {i + 1}
                </p>
                <h2 className="text-tinta-titulo text-[26px] leading-8 font-semibold">
                  <Link
                    href={`/poema/${p.id}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {p.titulo}
                  </Link>
                </h2>
                <p className="text-tinta-suave truncate text-[18px] leading-8 italic">
                  {p.verso}
                </p>
                <div className="mt-3 flex gap-3">
                  <Link
                    href={`/poema/${p.id}/editar`}
                    className="pildora border-tinta/30 text-tinta hover:bg-tinta/5"
                    aria-label={`Editar «${p.titulo}»`}
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    className="pildora border-vino text-vino hover:bg-vino/8"
                    aria-label={`Borrar «${p.titulo}»`}
                    aria-expanded={abierta}
                    aria-controls={`confirmar-${p.id}`}
                    onClick={() => {
                      setError(null);
                      setConfirmando(abierta ? null : p.id);
                    }}
                  >
                    Borrar
                  </button>
                </div>
              </div>

              {abierta && (
                <div
                  id={`confirmar-${p.id}`}
                  role="alertdialog"
                  aria-labelledby={`pregunta-${p.id}`}
                  className="bg-vino/9 px-6 py-4"
                >
                  <p id={`pregunta-${p.id}`} className="text-tinta-titulo text-[18px]">
                    ¿Borrar este poema para siempre?
                  </p>
                  {error && (
                    <p className="text-vino mt-1 text-[16px]" role="alert">
                      {error}
                    </p>
                  )}
                  <div className="mt-3 flex gap-3">
                    <button
                      type="button"
                      className="pildora pildora-vino"
                      disabled={borrando}
                      onClick={() => borrar(p.id)}
                    >
                      {borrando ? "Borrando…" : "Sí, borrar"}
                    </button>
                    <button
                      type="button"
                      className="pildora border-tinta/30 text-tinta hover:bg-tinta/5"
                      disabled={borrando}
                      autoFocus
                      onClick={() => setConfirmando(null)}
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
        href={`/escribir?fecha=${fecha}`}
        className="border-borde text-claro hover:bg-claro/7 mt-6 flex min-h-[52px] w-full items-center justify-center rounded-full border border-dashed text-[17px]"
      >
        {poemas.length === 0
          ? "+ Escribir un poema para este día"
          : "+ Agregar otro poema a este día"}
      </Link>
    </>
  );
}
