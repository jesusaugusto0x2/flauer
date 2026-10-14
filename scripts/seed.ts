/**
 * Llena la base con poemas de ejemplo. SOLO para desarrollo local.
 *
 *   pnpm db:seed
 *
 * Se niega a correr en producción, en Vercel o sobre una base que ya tenga poemas.
 */
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { poemas } from "../src/db/schema";
import { hoy } from "../src/lib/fechas";

config({ path: [".env.local", ".env"], quiet: true });

function abortar(motivo: string): never {
  console.error(`✗ Seed cancelado: ${motivo}`);
  process.exit(1);
}

if (
  process.env.NODE_ENV === "production" ||
  process.env.VERCEL ||
  process.env.VERCEL_ENV
) {
  abortar("no se ejecuta en producción ni en Vercel.");
}
if (!process.env.DATABASE_URL) abortar("falta DATABASE_URL en .env.local.");

/** Fecha de hace `n` días (respecto a hoy en Caracas), AAAA-MM-DD. */
function haceDias(n: number) {
  const [a, m, d] = hoy().split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d - n)).toISOString().slice(0, 10);
}

const ejemplos: { dias: number; titulo: string | null; texto: string }[] = [
  {
    dias: 0,
    titulo: "Lo que dejó la lluvia",
    texto:
      "Llovió toda la tarde\ny el patio se quedó pensando.\nUna flor, cansada de esperar,\nabrió sola sus manos.",
  },
  {
    dias: 0,
    titulo: null,
    texto:
      "Hoy no tengo título,\nsolo esta luz de las seis\nque entra torcida\ny se sienta a mi lado.",
  },
  {
    dias: 2,
    titulo: "Mapa",
    texto:
      "Dibujé tu nombre\nen el vapor del espejo.\nSe fue borrando despacio,\ncomo se borran los caminos\nque uno ya se sabe de memoria.",
  },
  {
    dias: 5,
    titulo: "Café",
    texto: "La taza tibia,\nel silencio tibio,\nla mañana entera\ncabe en mis dos manos.",
  },
  {
    dias: 5,
    titulo: "Ventana",
    texto:
      "Desde aquí el Ávila\nse pone el sombrero de nubes\ny saluda a nadie.\nYo le devuelvo el saludo.",
  },
  {
    dias: 5,
    titulo: "Inventario",
    texto:
      "Tres libros a medias,\nuna llave que no abre nada,\nuna carta sin sobre\ny las ganas de escribirte.",
  },
  {
    dias: 5,
    titulo: "Cuarta flor",
    texto:
      "Cuando un día da para tanto\nhay que dejarlo florecer\nsin preguntarle por qué.",
  },
  {
    dias: 9,
    titulo: "Noche",
    texto:
      "La noche es un papel azul\ncon rayas que nadie ve.\nYo escribo encima despacio\npara no despertar a la luna.",
  },
  {
    dias: 16,
    titulo: "Semilla",
    texto:
      "Todo lo que digo\nempezó siendo callado.\nAsí empiezan también\nlos jardines.",
  },
  {
    dias: 33,
    titulo: "El mes pasado",
    texto:
      "Lo que fui el mes pasado\nme mira desde el calendario\ncon una flor en la mano\ny cara de no arrepentirse.",
  },
];

async function main() {
  const db = drizzle(neon(process.env.DATABASE_URL!));

  const [{ total }] = await db.select({ total: count() }).from(poemas);
  if (total > 0)
    abortar(`la base ya tiene ${total} poemas; el seed solo llena bases vacías.`);

  // Se insertan de a uno para que creado_en respete el orden dentro de cada día.
  for (const e of ejemplos) {
    await db
      .insert(poemas)
      .values({ fecha: haceDias(e.dias), titulo: e.titulo, texto: e.texto });
  }
  console.log(`✓ ${ejemplos.length} poemas de ejemplo creados.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
