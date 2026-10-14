import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Barra } from "@/components/barra";
import { Cargando } from "@/components/cargando";
import { FormularioPoema } from "@/components/formulario-poema";
import { InterruptorModo } from "@/components/interruptor-modo";
import { fechaCorta, hoy } from "@/lib/fechas";
import { poemaPorId } from "@/lib/poemas";
import { modoActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Editar poema", robots: { index: false } };

export default function Editar({ params }: PageProps<"/poema/[id]/editar">) {
  return (
    <Suspense fallback={<Cargando />}>
      <ContenidoEditar params={params} />
    </Suspense>
  );
}

async function ContenidoEditar({
  params,
}: Pick<PageProps<"/poema/[id]/editar">, "params">) {
  const [{ id }, { sesion, modo }] = await Promise.all([params, modoActual()]);
  // Sin sesión, esta página no existe.
  if (!sesion) notFound();

  const poema = await poemaPorId(id);
  if (!poema) notFound();
  const dia = `/dia/${poema.fecha}`;

  return (
    <main>
      <Barra volver={dia} textoVolver={fechaCorta(poema.fecha)}>
        <InterruptorModo modo={modo} />
      </Barra>
      <h1 className="font-mano mb-6 text-[44px] leading-tight font-semibold">
        Editar poema
      </h1>
      <FormularioPoema
        hoy={hoy()}
        cancelar={dia}
        poema={{
          id: poema.id,
          fecha: poema.fecha,
          titulo: poema.titulo ?? "",
          texto: poema.texto,
        }}
      />
    </main>
  );
}
