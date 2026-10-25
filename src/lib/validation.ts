import { z } from "zod";
import { isValidDate, today } from "./dates";
import { normalizeSpotifyUrl } from "./spotify";
import { parseVideoLink } from "./video-links";

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

/** A video's note is a line or two about it. */
const MAX_VIDEO_NOTE = 1000;

// The date isn't here: a video always gets the day it was added, on the server.
export const videoSchema = z
  .object({
    link: z
      .string()
      .trim()
      .min(1, "Pega el enlace del video.")
      .transform((link, ctx) => {
        const video = parseVideoLink(link);
        if (!video) {
          ctx.addIssue({
            code: "custom",
            message:
              "Ese enlace no es de un video de Drive ni de YouTube. En Drive, abre el video y toca Compartir → Copiar enlace.",
          });
          return z.NEVER;
        }
        return video;
      }),
    title: z
      .string()
      .trim()
      .min(1, "Ponle un título al video.")
      .max(200, "El título es demasiado largo (máx. 200 caracteres)."),
    note: z
      .string()
      .transform((t) => t.replace(/\r\n/g, "\n").replace(/^\n+|\s+$/g, ""))
      .refine(
        (t) => t.length <= MAX_VIDEO_NOTE,
        `La nota es demasiado larga (máx. ${MAX_VIDEO_NOTE} caracteres).`,
      )
      .transform((t) => t || null),
    vertical: z.boolean(),
  })
  // Only where the video is gets stored, never the link as pasted.
  .transform(({ link, ...video }) => ({ ...link, ...video }));

export type VideoInput = z.output<typeof videoSchema>;

export type VideoField = "link" | "title" | "note";

export type VideoFormState = {
  fieldErrors?: Partial<Record<VideoField, string>>;
  error?: string;
};
