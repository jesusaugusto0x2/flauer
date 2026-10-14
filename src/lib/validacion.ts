import { z } from "zod";
import { esFechaValida, hoy } from "./fechas";

export const esquemaPoema = z.object({
  fecha: z
    .string({ error: "Elige una fecha." })
    .trim()
    .refine(esFechaValida, "Elige una fecha válida.")
    .refine((f) => f <= hoy(), "No se puede escribir en un día que aún no llega."),
  titulo: z
    .string()
    .trim()
    .max(200, "El título es demasiado largo (máx. 200 caracteres).")
    .transform((t) => t || null),
  texto: z
    .string()
    // Normaliza saltos de línea y quita líneas vacías al principio y espacios al final.
    .transform((t) => t.replace(/\r\n/g, "\n").replace(/^\n+|\s+$/g, ""))
    .refine((t) => t.trim().length > 0, "El poema no puede estar vacío.")
    .refine((t) => t.length <= 20000, "El poema es demasiado largo."),
});

export type CamposPoema = "fecha" | "titulo" | "texto";

export type EstadoFormulario = {
  errores?: Partial<Record<CamposPoema, string>>;
  error?: string;
  valores?: { fecha: string; titulo: string; texto: string };
};
