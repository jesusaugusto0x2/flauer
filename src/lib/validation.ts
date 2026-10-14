import { z } from "zod";
import { isValidDate, today } from "./dates";
import { normalizeSpotifyUrl } from "./spotify";

const MAX_BODY = 20000;
/** "Por qué te identifica" is a short reason, so songs keep it brief. */
const MAX_SONG_BODY = 1000;

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((t) => t || null);

// Error messages are user-facing, so they stay in Spanish.
export const entrySchema = z
  .object({
    kind: z.enum(["poem", "note", "song"], {
      error: "Elige si es un poema, una nota o una canción.",
    }),
    date: z
      .string({ error: "Elige una fecha." })
      .trim()
      .refine(isValidDate, "Elige una fecha válida.")
      .refine((d) => d <= today(), "No se puede escribir en un día que aún no llega."),
    title: optionalText(200, "El título es demasiado largo (máx. 200 caracteres)."),
    // Normalize line breaks and strip leading blank lines and trailing whitespace.
    body: z.string().transform((t) => t.replace(/\r\n/g, "\n").replace(/^\n+|\s+$/g, "")),
    artist: optionalText(200, "El nombre del artista es demasiado largo."),
    spotifyUrl: z.string().trim(),
  })
  .superRefine((entry, ctx) => {
    const issue = (path: EntryField, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });

    if (entry.kind === "song") {
      if (!entry.spotifyUrl) {
        issue("spotifyUrl", "Pega el enlace de la canción en Spotify.");
      } else if (!normalizeSpotifyUrl(entry.spotifyUrl)) {
        issue(
          "spotifyUrl",
          "Ese enlace no es de Spotify. Cópialo desde Spotify: Compartir → Copiar enlace.",
        );
      }
      if (!entry.title) issue("title", "Escribe el nombre de la canción.");
      if (!entry.artist) issue("artist", "Escribe quién la canta.");
      if (entry.body.length > MAX_SONG_BODY) {
        issue("body", `Es demasiado largo (máx. ${MAX_SONG_BODY} caracteres).`);
      }
      return;
    }

    const noun = entry.kind === "poem" ? "El poema" : "La nota";
    const isPoem = entry.kind === "poem";
    if (!entry.body.trim()) {
      issue("body", `${noun} no puede estar ${isPoem ? "vacío" : "vacía"}.`);
    } else if (entry.body.length > MAX_BODY) {
      issue("body", `${noun} es demasiado ${isPoem ? "largo" : "larga"}.`);
    }
  })
  // Only songs keep an artist and a link, always in their clean form.
  .transform((entry) =>
    entry.kind === "song"
      ? { ...entry, spotifyUrl: normalizeSpotifyUrl(entry.spotifyUrl) }
      : { ...entry, artist: null, spotifyUrl: null },
  );

export type EntryInput = z.output<typeof entrySchema>;

export type EntryField = "kind" | "date" | "title" | "body" | "artist" | "spotifyUrl";

export type EntryFormState = {
  fieldErrors?: Partial<Record<EntryField, string>>;
  error?: string;
};
