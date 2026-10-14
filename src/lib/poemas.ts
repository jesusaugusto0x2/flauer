import "server-only";
import { and, asc, count, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { poemas, type Poema } from "@/db/schema";
import { aFecha } from "./fechas";

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const esIdValido = (id: string) => RE_UUID.test(id);

export const tituloVisible = (p: Pick<Poema, "titulo">) =>
  p.titulo?.trim() || "Sin título";

export function primerVerso(texto: string) {
  return (
    texto
      .split("\n")
      .find((l) => l.trim())
      ?.trim() ?? ""
  );
}

/** Cantidad de poemas por día dentro de un mes (AAAA-MM). */
export async function conteoDelMes(mes: string): Promise<Record<string, number>> {
  const [anio, m] = mes.split("-").map(Number);
  const ultimo = new Date(Date.UTC(anio, m, 0)).getUTCDate();
  const filas = await db()
    .select({ fecha: poemas.fecha, total: count() })
    .from(poemas)
    .where(
      and(
        gte(poemas.fecha, aFecha(anio, m, 1)),
        lte(poemas.fecha, aFecha(anio, m, ultimo)),
      ),
    )
    .groupBy(poemas.fecha);
  return Object.fromEntries(filas.map((f) => [f.fecha, f.total]));
}

export async function poemasDelDia(fecha: string): Promise<Poema[]> {
  return db()
    .select()
    .from(poemas)
    .where(eq(poemas.fecha, fecha))
    .orderBy(asc(poemas.creadoEn), asc(poemas.id));
}

export async function poemaPorId(id: string): Promise<Poema | undefined> {
  if (!esIdValido(id)) return undefined;
  const [p] = await db().select().from(poemas).where(eq(poemas.id, id)).limit(1);
  return p;
}

export async function crearPoema(datos: {
  fecha: string;
  titulo: string | null;
  texto: string;
}) {
  const [p] = await db().insert(poemas).values(datos).returning({ id: poemas.id });
  return p.id;
}

export async function editarPoema(
  id: string,
  datos: { fecha: string; titulo: string | null; texto: string },
) {
  const filas = await db()
    .update(poemas)
    .set({ ...datos, editadoEn: new Date() })
    .where(eq(poemas.id, id))
    .returning({ id: poemas.id });
  return filas.length > 0;
}

export async function borrarPoema(id: string) {
  const filas = await db()
    .delete(poemas)
    .where(eq(poemas.id, id))
    .returning({ fecha: poemas.fecha });
  return filas[0]?.fecha;
}

export async function contarDia(fecha: string): Promise<number> {
  const [fila] = await db()
    .select({ total: count() })
    .from(poemas)
    .where(eq(poemas.fecha, fecha));
  return fila?.total ?? 0;
}
