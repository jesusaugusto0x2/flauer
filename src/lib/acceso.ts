import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { intentosAcceso } from "@/db/schema";

const VENTANA_MINUTOS = 15;
const MAX_POR_IP = 5;
// Tope global por si alguien rota direcciones IP.
const MAX_GLOBAL = 30;

/** Compara la contraseña con OWNER_PASSWORD en tiempo constante. */
export function contrasenaCorrecta(intento: string): boolean {
  const real = process.env.OWNER_PASSWORD;
  if (!real) throw new Error("Falta la variable de entorno OWNER_PASSWORD.");
  // Hashear iguala las longitudes, que timingSafeEqual exige.
  const a = createHash("sha256").update(intento).digest();
  const b = createHash("sha256").update(real).digest();
  return timingSafeEqual(a, b);
}

async function ipCliente() {
  const h = await headers();
  return (
    h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "desconocida"
  );
}

async function sumarIntento(clave: string): Promise<number> {
  const vencida = sql`${intentosAcceso.ventanaInicio} < now() - make_interval(mins => ${VENTANA_MINUTOS})`;
  const [fila] = await db()
    .insert(intentosAcceso)
    .values({ clave, intentos: 1 })
    .onConflictDoUpdate({
      target: intentosAcceso.clave,
      set: {
        intentos: sql`case when ${vencida} then 1 else ${intentosAcceso.intentos} + 1 end`,
        ventanaInicio: sql`case when ${vencida} then now() else ${intentosAcceso.ventanaInicio} end`,
      },
    })
    .returning({ intentos: intentosAcceso.intentos });
  return fila.intentos;
}

/**
 * Registra un intento de acceso. Devuelve false si se superó el límite y hay
 * que rechazarlo sin mirar la contraseña.
 */
export async function registrarIntento(): Promise<{ permitido: boolean; ip: string }> {
  const ip = await ipCliente();
  const [porIp, global] = await Promise.all([
    sumarIntento(`ip:${ip}`),
    sumarIntento("global"),
  ]);
  return { permitido: porIp <= MAX_POR_IP && global <= MAX_GLOBAL, ip };
}

export async function limpiarIntentos(ip: string) {
  await db()
    .delete(intentosAcceso)
    .where(eq(intentosAcceso.clave, `ip:${ip}`));
}
