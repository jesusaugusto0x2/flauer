import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Barra } from "@/components/barra";
import { Cargando } from "@/components/cargando";
import { FlorTrazo } from "@/components/iconos";
import { FIRMA } from "@/lib/config";
import { fechaCorta, fechaLarga } from "@/lib/fechas";
import { poemaPorId, poemasDelDia, tituloVisible } from "@/lib/poemas";

export default function Poema({ params }: PageProps<"/poema/[id]">) {
  return (
    <Suspense fallback={<Cargando />}>
      <ContenidoPoema params={params} />
    </Suspense>
  );
}

const CLASE_NAV = "pildora px-4";

async function ContenidoPoema({ params }: Pick<PageProps<"/poema/[id]">, "params">) {
  const { id } = await params;
  const poema = await poemaPorId(id);
  if (!poema) notFound();

  const delDia = await poemasDelDia(poema.fecha);
  const indice = delDia.findIndex((p) => p.id === poema.id);
  const anterior = delDia[indice - 1];
  const siguiente = delDia[indice + 1];

  return (
    <main>
      <Barra volver={`/dia/${poema.fecha}`} textoVolver={fechaCorta(poema.fecha)}>
        <span className="text-secundario text-[17px] italic">
          Poema {indice + 1} de {delDia.length}
        </span>
      </Barra>

      <article className="papel px-6 pt-8 pb-8">
        <FlorTrazo className="absolute top-3 right-3 opacity-55" />
        <p className="text-tinta-suave pr-14 text-[16px] leading-8 italic">
          {fechaLarga(poema.fecha)}
        </p>
        <h1 className="text-tinta-titulo pr-14 text-[32px] leading-8 font-semibold">
          {tituloVisible(poema)}
        </h1>
        <div className="mt-8 text-[19px] leading-8 whitespace-pre-line">
          {poema.texto}
        </div>
        {FIRMA && (
          <p className="font-mano text-vino mt-8 text-right text-[24px] leading-8 font-semibold">
            {FIRMA}
          </p>
        )}
      </article>

      <nav aria-label="Poemas de este día" className="mt-8 flex justify-between gap-3">
        {anterior ? (
          <Link href={`/poema/${anterior.id}`} className={CLASE_NAV}>
            <span aria-hidden="true">←</span> Anterior
          </Link>
        ) : (
          <span className={`${CLASE_NAV} opacity-35`} aria-disabled="true">
            <span aria-hidden="true">←</span> Anterior
          </span>
        )}
        {siguiente ? (
          <Link href={`/poema/${siguiente.id}`} className={CLASE_NAV}>
            Siguiente poema <span aria-hidden="true">→</span>
          </Link>
        ) : (
          <span className={`${CLASE_NAV} opacity-35`} aria-disabled="true">
            Siguiente poema <span aria-hidden="true">→</span>
          </span>
        )}
      </nav>
    </main>
  );
}
