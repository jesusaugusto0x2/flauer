import type { EntryKind } from "@/db/schema";
import { LOCALE } from "./config";
import { plural } from "./dates";

// Spanish, user-facing wording for each entry kind. Safe to import on the client.

export type KindCounts = Record<EntryKind, number>;

/** Display order everywhere: calendar flowers, legends, counts. */
export const ENTRY_KINDS: EntryKind[] = ["poem", "note", "song"];

export const isEntryKind = (value: unknown): value is EntryKind =>
  typeof value === "string" && (ENTRY_KINDS as string[]).includes(value);

export const emptyCounts = (): KindCounts => ({ poem: 0, note: 0, song: 0 });

export const totalCount = (counts: KindCounts) =>
  ENTRY_KINDS.reduce((sum, kind) => sum + counts[kind], 0);

const WORDS: Record<EntryKind, { label: string; one: string; many: string }> = {
  poem: { label: "Poema", one: "poema", many: "poemas" },
  note: { label: "Nota", one: "nota", many: "notas" },
  song: { label: "Canción", one: "canción", many: "canciones" },
};

export const kindLabel = (kind: EntryKind) => WORDS[kind].label;

export const countLabel = (kind: EntryKind, n: number) =>
  plural(n, WORDS[kind].one, WORDS[kind].many);

const listFormat = new Intl.ListFormat(LOCALE, { type: "conjunction" });

/** "2 poemas, 1 nota y 1 canción". Empty string when there is nothing. */
export function describeCounts(counts: KindCounts) {
  return listFormat.format(
    ENTRY_KINDS.filter((k) => counts[k] > 0).map((k) => countLabel(k, counts[k])),
  );
}

/** Heading for an entry. Notes may have no title; songs always have a name. */
export function displayTitle(entry: { kind: EntryKind; title: string | null }) {
  const title = entry.title?.trim();
  if (title) return title;
  return entry.kind === "note" ? "Nota" : "Sin título";
}

export function firstLine(body: string) {
  return (
    body
      .split("\n")
      .find((l) => l.trim())
      ?.trim() ?? ""
  );
}
