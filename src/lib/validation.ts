import { z } from "zod";
import { isValidDate, today } from "./dates";

const MAX_BODY = 20000;

// Error messages are user-facing, so they stay in Spanish.
export const entrySchema = z
  .object({
    kind: z.enum(["poem", "note"], { error: "Elige si es un poema o una nota." }),
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
    // Normalize line breaks and strip leading blank lines and trailing whitespace.
    body: z.string().transform((t) => t.replace(/\r\n/g, "\n").replace(/^\n+|\s+$/g, "")),
  })
  .superRefine(({ kind, body }, ctx) => {
    const noun = kind === "poem" ? "El poema" : "La nota";
    if (!body.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["body"],
        message: `${noun} no puede estar ${kind === "poem" ? "vacío" : "vacía"}.`,
      });
    } else if (body.length > MAX_BODY) {
      ctx.addIssue({
        code: "custom",
        path: ["body"],
        message: `${noun} es demasiado ${kind === "poem" ? "largo" : "larga"}.`,
      });
    }
  });

export type EntryField = "kind" | "date" | "title" | "body";

export type EntryFormState = {
  fieldErrors?: Partial<Record<EntryField, string>>;
  error?: string;
};
