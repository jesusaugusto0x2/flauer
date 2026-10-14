import { sql } from "drizzle-orm";
import {
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const poemas = pgTable(
  "poemas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // El día al que pertenece el poema (AAAA-MM-DD), no cuándo se creó.
    fecha: date("fecha", { mode: "string" }).notNull(),
    titulo: text("titulo"),
    texto: text("texto").notNull(),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
    editadoEn: timestamp("editado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("poemas_fecha_idx").on(t.fecha, t.creadoEn)],
);

// Intentos de acceso a /entrar, para el rate-limit del login.
export const intentosAcceso = pgTable("intentos_acceso", {
  clave: text("clave").primaryKey(),
  intentos: integer("intentos").notNull().default(0),
  ventanaInicio: timestamp("ventana_inicio", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export type Poema = typeof poemas.$inferSelect;
export type PoemaNuevo = typeof poemas.$inferInsert;
