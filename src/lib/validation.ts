import { z } from "zod";
import { isValidDate, today } from "./dates";

// Error messages are user-facing, so they stay in Spanish.
export const poemSchema = z.object({
  date: z
    .string({ error: "Elige una fecha." })
    .trim()
    .refine(isValidDate, "Elige una fecha válida.")
    .refine((d) => d <= today(), "No se puede escribir en un día que aún no llega."),
  title: z
    .string()
    .trim()
    .max(200, "El título es demasiado largo (máx. 200 caracteres).")
    .transform((t) => t || null),
  body: z
    .string()
    // Normalize line breaks and strip leading blank lines and trailing whitespace.
    .transform((t) => t.replace(/\r\n/g, "\n").replace(/^\n+|\s+$/g, ""))
    .refine((t) => t.trim().length > 0, "El poema no puede estar vacío.")
    .refine((t) => t.length <= 20000, "El poema es demasiado largo."),
});

export type PoemField = "date" | "title" | "body";

export type PoemFormState = {
  fieldErrors?: Partial<Record<PoemField, string>>;
  error?: string;
};
