import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let instance: NeonHttpDatabase<typeof schema> | undefined;

// Created on first use so the build doesn't need DATABASE_URL.
export function db() {
  if (!instance) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("Missing DATABASE_URL environment variable.");
    instance = drizzle(neon(url), { schema });
  }
  return instance;
}
