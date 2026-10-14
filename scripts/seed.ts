/**
 * Fills the database with sample poems, notes and songs. LOCAL DEVELOPMENT ONLY.
 *
 *   pnpm db:seed
 *
 * Refuses to run in production, on Vercel, or against a database that already has entries.
 */
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { entries, type EntryKind } from "../src/db/schema";
import { today } from "../src/lib/dates";

config({ path: [".env.local", ".env"], quiet: true });

function abort(reason: string): never {
  console.error(`✗ Seed aborted: ${reason}`);
  process.exit(1);
}

if (
  process.env.NODE_ENV === "production" ||
  process.env.VERCEL ||
  process.env.VERCEL_ENV
) {
  abort("it never runs in production or on Vercel.");
}
if (!process.env.DATABASE_URL) abort("DATABASE_URL is missing from .env.local.");

/** Date `n` days ago (relative to today in Caracas), YYYY-MM-DD. */
function daysAgo(n: number) {
  const [y, m, d] = today().split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - n)).toISOString().slice(0, 10);
}

// Sample content is in Spanish, like the diary itself.
// Song links are made-up placeholders with the right shape; they won't play.
const samples: {
  kind?: EntryKind;
  daysAgo: number;
  title: string | null;
  body: string;
  artist?: string;
  spotifyUrl?: string;
}[] = [
  {
    daysAgo: 0,
    title: "Lo que dejó la lluvia",
    body: "Llovió toda la tarde\ny el patio se quedó pensando.\nUna flor, cansada de esperar,\nabrió sola sus manos.",
  },
  {
    daysAgo: 0,
    title: null,
    body: "Hoy no tengo título,\nsolo esta luz de las seis\nque entra torcida\ny se sienta a mi lado.",
  },
  {
    daysAgo: 2,
    title: "Mapa",
    body: "Dibujé tu nombre\nen el vapor del espejo.\nSe fue borrando despacio,\ncomo se borran los caminos\nque uno ya se sabe de memoria.",
  },
  {
    daysAgo: 5,
    title: "Café",
    body: "La taza tibia,\nel silencio tibio,\nla mañana entera\ncabe en mis dos manos.",
  },
  {
    daysAgo: 5,
    title: "Ventana",
    body: "Desde aquí el Ávila\nse pone el sombrero de nubes\ny saluda a nadie.\nYo le devuelvo el saludo.",
  },
  {
    daysAgo: 5,
    title: "Inventario",
    body: "Tres libros a medias,\nuna llave que no abre nada,\nuna carta sin sobre\ny las ganas de escribirte.",
  },
  {
    daysAgo: 5,
    title: "Cuarta flor",
    body: "Cuando un día da para tanto\nhay que dejarlo florecer\nsin preguntarle por qué.",
  },
  {
    daysAgo: 9,
    title: "Noche",
    body: "La noche es un papel azul\ncon rayas que nadie ve.\nYo escribo encima despacio\npara no despertar a la luna.",
  },
  {
    daysAgo: 16,
    title: "Semilla",
    body: "Todo lo que digo\nempezó siendo callado.\nAsí empiezan también\nlos jardines.",
  },
  {
    daysAgo: 33,
    title: "El mes pasado",
    body: "Lo que fui el mes pasado\nme mira desde el calendario\ncon una flor en la mano\ny cara de no arrepentirse.",
  },
  {
    kind: "note",
    daysAgo: 0,
    title: null,
    body: "Hoy vi la primera flor del jazmín. Quería contártelo antes de que se me olvidara.",
  },
  {
    kind: "note",
    daysAgo: 2,
    title: "Para acordarme",
    body: "Comprar el cuaderno azul.\nLlamar a mamá el domingo.",
  },
  {
    kind: "note",
    daysAgo: 9,
    title: null,
    body: "No escribí poema. Fue un día largo y solo quería dormir.",
  },
  {
    kind: "note",
    daysAgo: 5,
    title: "Lo que pasó el sábado",
    body:
      "Fuimos al mercado temprano, antes de que llegara el calor. Compramos mangos, " +
      "un ramo de girasoles y pan de jamón aunque todavía no es diciembre.\n\n" +
      "En la vuelta nos agarró la lluvia y nos metimos en una panadería a esperar. " +
      "Pedimos dos marroncitos y nos quedamos hablando de todo y de nada.\n\n" +
      "Quiero acordarme de ese olor a pan y a lluvia, y de cómo te reías cuando " +
      "se te mojaron los zapatos nuevos.",
  },
  {
    kind: "song",
    daysAgo: 0,
    title: "Luz de las seis",
    artist: "Banda de ejemplo",
    spotifyUrl: "https://open.spotify.com/track/0000000000000000000001",
    body: "Me recuerda a la tarde de hoy, cuando todo se puso naranja.",
  },
  {
    kind: "song",
    daysAgo: 2,
    title: "Mapa de bolsillo",
    artist: "Otra banda de ejemplo",
    spotifyUrl: "https://open.spotify.com/track/0000000000000000000002",
    body: "",
  },
];

async function main() {
  const db = drizzle(neon(process.env.DATABASE_URL!));

  const [{ total }] = await db.select({ total: count() }).from(entries);
  if (total > 0) {
    abort(`the database already has ${total} entries; seeding only fills empty ones.`);
  }

  // Inserted one by one so created_at keeps the order within each day.
  for (const s of samples) {
    await db.insert(entries).values({
      kind: s.kind ?? "poem",
      date: daysAgo(s.daysAgo),
      title: s.title,
      body: s.body,
      artist: s.artist ?? null,
      spotifyUrl: s.spotifyUrl ?? null,
    });
  }
  console.log(`✓ Created ${samples.length} sample entries.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
