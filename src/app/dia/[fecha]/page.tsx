import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Barra } from "@/components/barra";
import { Cargando } from "@/components/cargando";
import { Flores } from "@/components/iconos";
import { InterruptorModo } from "@/components/interruptor-modo";
import { APP_NOMBRE } from "@/lib/config";
import {
  diaDeLaSemana,
  esFechaValida,
  fechaMedia,
  hoy,
  mesDe,
  plural,
} from "@/lib/fechas";
import { poemasDelDia, primerVerso, tituloVisible } from "@/lib/poemas";
import { modoActual } from "@/lib/sesion";
import { ListaEscritura } from "./lista-escritura";

export default function Dia({ params }: PageProps<"/dia/[fecha]">) {
  return (
    <Suspense fallback={<Cargando />}>
      <ContenidoDia params={params} />
    </Suspense>
  );
}

async function ContenidoDia({ params }: Pick<PageProps<"/dia/[fecha]">, "params">) {
  const { fecha } = await params;
  const fechaHoy = hoy();
  if (!esFechaValida(fecha) || fecha > fechaHoy) notFound();

  const [{ sesion, modo }, poemas] = await Promise.all([
    modoActual(),
    poemasDelDia(fecha),
  ]);
  const esHoy = fecha === fechaHoy;
  const volver = mesDe(fecha) === mesDe(fechaHoy) ? "/" : `/?mes=${mesDe(fecha)}`;
  const escritura = modo === "escritura";

  return (
    <main>
      <Barra volver={volver} textoVolver="Calendario">
        {sesion ? (
          <InterruptorModo modo={modo} />
        ) : (
          <span className="font-mano text-[28px] leading-none font-semibold">
            {APP_NOMBRE}
          </span>
        )}
      </Barra>

      <header>
        <p className="text-secundario text-[13px] tracking-[0.2em] uppercase">
          {diaDeLaSemana(fecha)}
          {esHoy && " · hoy"}
        </p>
        <h1 className="font-mano mt-1 text-[46px] leading-tight font-semibold">
          {fechaMedia(fecha)}
        </h1>
        {poemas.length > 0 && (
          <p className="text-rosa mt-1 flex items-center gap-2 text-[17px]">
            <Flores cantidad={poemas.length} />
            <span>{plural(poemas.length, "poema", "poemas")}</span>
          </p>
        )}
      </header>

      {escritura ? (
        <ListaEscritura
          fecha={fecha}
          poemas={poemas.map((p) => ({
            id: p.id,
            titulo: tituloVisible(p),
            verso: primerVerso(p.texto),
          }))}
        />
      ) : poemas.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-secundario text-[19px] italic">
            {esHoy
              ? "Hoy todavía no florece ningún poema."
              : "Este día no tiene poemas. Quizá fue un día de silencio."}
          </p>
          <Link href={volver} className="pildora mt-8">
            <span aria-hidden="true">←</span> Volver al calendario
          </Link>
        </div>
      ) : (
        <>
          <p className="text-secundario mt-6 text-[18px] italic">Elige qué poema leer.</p>
          <ul className="mt-5 flex flex-col gap-5">
            {poemas.map((p, i) => (
              <li key={p.id}>
                <Link href={`/poema/${p.id}`} className="papel block px-6 pt-4 pb-4">
                  <span className="font-mano text-vino block text-[20px] leading-8 font-semibold">
                    Poema {i + 1}
                  </span>
                  <span className="text-tinta-titulo block text-[26px] leading-8 font-semibold">
                    {tituloVisible(p)}
                  </span>
                  <span className="text-tinta-suave block truncate text-[18px] leading-8 italic">
                    {primerVerso(p.texto)}
                  </span>
                  <span className="text-vino block text-right text-[17px] leading-8 font-semibold">
                    Leer <span aria-hidden="true">→</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
