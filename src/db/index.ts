import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let instancia: NeonHttpDatabase<typeof schema> | undefined;

// Se crea al primer uso para que el build no necesite DATABASE_URL.
export function db() {
  if (!instancia) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("Falta la variable de entorno DATABASE_URL.");
    instancia = drizzle(neon(url), { schema });
  }
  return instancia;
}
