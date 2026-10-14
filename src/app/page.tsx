import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Cargando } from "@/components/cargando";
import { Flor, Flores } from "@/components/iconos";
import { InterruptorModo } from "@/components/interruptor-modo";
import { APP_NOMBRE, APP_SUBTITULO } from "@/lib/config";
import {
  esMesValido,
  fechaCorta,
  hoy,
  mesDe,
  nombreDelMes,
  plural,
  semanasDelMes,
  soloMes,
  sumarMeses,
} from "@/lib/fechas";
import { contarDia, conteoDelMes } from "@/lib/poemas";
import { modoActual, type Modo } from "@/lib/sesion";

const DIAS_SEMANA = [
  { corto: "L", largo: "lunes" },
  { corto: "M", largo: "martes" },
  { corto: "X", largo: "miércoles" },
  { corto: "J", largo: "jueves" },
  { corto: "V", largo: "viernes" },
  { corto: "S", largo: "sábado" },
  { corto: "D", largo: "domingo" },
];

export default function Inicio({ searchParams }: PageProps<"/">) {
  return (
    <main>
      <header className="pt-4 text-center">
        <p className="antetitulo">Diario de poemas</p>
        <h1 className="font-mano mt-1 text-[64px] leading-none font-semibold">
          {APP_NOMBRE}
        </h1>
        <p className="text-secundario mt-2 text-[17px] italic">{APP_SUBTITULO}</p>
      </header>
      <Suspense fallback={<Cargando />}>
        <Calendario searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

const urlMes = (mes: string, mesActual: string) =>
  mes === mesActual ? "/" : `/?mes=${mes}`;

async function Calendario({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  await connection();
  const [{ mes: mesPedido }, { sesion, modo }] = await Promise.all([
    searchParams,
    modoActual(),
  ]);
  const fechaHoy = hoy();
  const mesActual = mesDe(fechaHoy);
  const mes =
    typeof mesPedido === "string" && esMesValido(mesPedido) && mesPedido <= mesActual
      ? mesPedido
      : mesActual;

  const [conteo, poemasHoy] = await Promise.all([
    conteoDelMes(mes),
    mes === mesActual ? undefined : contarDia(fechaHoy),
  ]);
  const totalHoy = poemasHoy ?? conteo[fechaHoy] ?? 0;
  const totalMes = Object.values(conteo).reduce((a, b) => a + b, 0);
  const anterior = sumarMeses(mes, -1);
  const esMesActual = mes === mesActual;

  return (
    <>
      {sesion && (
        <div className="mt-6 flex justify-center">
          <InterruptorModo modo={modo} />
        </div>
      )}

      <section aria-labelledby="titulo-mes" className="mt-8">
        <div className="flex items-center justify-between">
          <Link
            href={urlMes(anterior, mesActual)}
            className="border-borde hover:bg-claro/8 flex size-[44px] items-center justify-center rounded-full border text-[22px]"
            aria-label={`Mes anterior: ${nombreDelMes(anterior)}`}
          >
            <span aria-hidden="true">‹</span>
          </Link>
          <h2
            id="titulo-mes"
            className="font-mano text-[34px] leading-none font-semibold"
          >
            {nombreDelMes(mes)}
          </h2>
          {esMesActual ? (
            <button
              type="button"
              disabled
              className="border-borde flex size-[44px] cursor-not-allowed items-center justify-center rounded-full border text-[22px] opacity-35"
              aria-label="Mes siguiente (no disponible)"
            >
              <span aria-hidden="true">›</span>
            </button>
          ) : (
            <Link
              href={urlMes(sumarMeses(mes, 1), mesActual)}
              className="border-borde hover:bg-claro/8 flex size-[44px] items-center justify-center rounded-full border text-[22px]"
              aria-label={`Mes siguiente: ${nombreDelMes(sumarMeses(mes, 1))}`}
            >
              <span aria-hidden="true">›</span>
            </Link>
          )}
        </div>

        <div className="mt-6 grid grid-cols-7 gap-[6px]" aria-hidden="true">
          {DIAS_SEMANA.map((d) => (
            <abbr
              key={d.corto}
              title={d.largo}
              className="text-secundario text-center text-[13px] no-underline"
            >
              {d.corto}
            </abbr>
          ))}
        </div>

        <ol
          className="mt-2 grid grid-cols-7 gap-[6px]"
          aria-label={`Días de ${nombreDelMes(mes)}`}
        >
          {semanasDelMes(mes)
            .flat()
            .map((fecha, i) => (
              <li key={fecha ?? `vacio-${i}`}>
                {fecha && (
                  <Celda
                    fecha={fecha}
                    cantidad={conteo[fecha] ?? 0}
                    fechaHoy={fechaHoy}
                    modo={modo}
                  />
                )}
              </li>
            ))}
        </ol>

        <div className="text-secundario mt-5 flex items-center justify-between text-[16px]">
          <span className="inline-flex items-center gap-2">
            <Flor /> <span>= un poema</span>
          </span>
          <span className="italic">
            {plural(totalMes, "poema", "poemas")} en {soloMes(mes)}
          </span>
        </div>
      </section>

      <div className="mt-10 flex justify-center">
        {modo === "escritura" ? (
          <Link href="/escribir" className="pildora pildora-vino px-6">
            + Escribir el poema de hoy
          </Link>
        ) : (
          totalHoy > 0 && (
            <Link href={`/dia/${fechaHoy}`} className="pildora px-6">
              Leer los poemas de hoy <span aria-hidden="true">→</span>
            </Link>
          )
        )}
      </div>
    </>
  );
}

const BASE_CELDA =
  "flex h-[62px] flex-col items-center gap-[5px] rounded-[10px] pt-[7px] text-[18px] leading-none";

function Celda({
  fecha,
  cantidad,
  fechaHoy,
  modo,
}: {
  fecha: string;
  cantidad: number;
  fechaHoy: string;
  modo: Modo;
}) {
  const dia = Number(fecha.slice(8));
  const esHoy = fecha === fechaHoy;
  const etiquetaDia = `${fechaCorta(fecha)}${esHoy ? ", hoy" : ""}`;

  if (fecha > fechaHoy) {
    return (
      <div
        role="img"
        aria-label={`${etiquetaDia}: aún no llega`}
        className={`${BASE_CELDA} opacity-25`}
      >
        {dia}
      </div>
    );
  }

  if (cantidad > 0) {
    return (
      <Link
        href={`/dia/${fecha}`}
        aria-label={`${etiquetaDia}: ${plural(cantidad, "poema", "poemas")}`}
        className={`${BASE_CELDA} ${
          esHoy
            ? "border-rosa bg-rosa/14 border font-semibold text-white"
            : "bg-claro/7 hover:bg-claro/12"
        }`}
      >
        <span>{dia}</span>
        {cantidad <= 3 ? (
          <Flores cantidad={cantidad} className="justify-center gap-[2px]" />
        ) : (
          <span className="inline-flex items-center gap-[3px]" aria-hidden="true">
            <Flor />
            <span className="text-rosa text-[12px]">{cantidad}</span>
          </span>
        )}
      </Link>
    );
  }

  const claseHoy = esHoy ? "border border-rosa font-semibold text-white" : "text-apagado";

  if (modo === "escritura") {
    return (
      <Link
        href={`/escribir?fecha=${fecha}`}
        aria-label={`${etiquetaDia}: sin poemas. Escribir uno`}
        className={`${BASE_CELDA} ${claseHoy} ${
          esHoy ? "" : "border-claro/25 border border-dashed"
        } hover:bg-claro/7`}
      >
        <span>{dia}</span>
        <span className="text-secundario text-[15px]" aria-hidden="true">
          +
        </span>
      </Link>
    );
  }

  return (
    <div
      role="img"
      aria-label={`${etiquetaDia}: sin poemas`}
      className={`${BASE_CELDA} ${claseHoy}`}
    >
      {dia}
    </div>
  );
}
