import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Barra } from "@/components/barra";
import { Cargando } from "@/components/cargando";
import { FormularioPoema } from "@/components/formulario-poema";
import { InterruptorModo } from "@/components/interruptor-modo";
import { esFechaValida, hoy, mesDe } from "@/lib/fechas";
import { modoActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Nuevo poema", robots: { index: false } };

export default function Escribir({ searchParams }: PageProps<"/escribir">) {
  return (
    <Suspense fallback={<Cargando />}>
      <ContenidoEscribir searchParams={searchParams} />
    </Suspense>
  );
}

async function ContenidoEscribir({
  searchParams,
}: Pick<PageProps<"/escribir">, "searchParams">) {
  const [{ fecha: pedida }, { sesion, modo }] = await Promise.all([
    searchParams,
    modoActual(),
  ]);
  // Sin sesión, esta página no existe.
  if (!sesion) notFound();

  const fechaHoy = hoy();
  const fecha =
    typeof pedida === "string" && esFechaValida(pedida) && pedida <= fechaHoy
      ? pedida
      : fechaHoy;
  const volver = mesDe(fecha) === mesDe(fechaHoy) ? "/" : `/?mes=${mesDe(fecha)}`;

  return (
    <main>
      <Barra volver={volver} textoVolver="Calendario">
        <InterruptorModo modo={modo} />
      </Barra>
      <h1 className="font-mano mb-6 text-[44px] leading-tight font-semibold">
        Nuevo poema
      </h1>
      <FormularioPoema hoy={fechaHoy} fechaInicial={fecha} />
    </main>
  );
}
