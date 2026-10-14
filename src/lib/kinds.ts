import type { EntryKind } from "@/db/schema";
import { plural } from "./dates";

// Spanish, user-facing wording for each entry kind. Safe to import on the client.

export type KindCounts = Record<EntryKind, number>;

export const ENTRY_KINDS: EntryKind[] = ["poem", "note"];

export const isEntryKind = (value: unknown): value is EntryKind =>
  value === "poem" || value === "note";

export const kindLabel = (kind: EntryKind) => (kind === "poem" ? "Poema" : "Nota");

export const countLabel = (kind: EntryKind, n: number) =>
  kind === "poem" ? plural(n, "poema", "poemas") : plural(n, "nota", "notas");

/** "3 poemas y 1 nota", "2 notas"… Empty string when there is nothing. */
export function describeCounts(counts: KindCounts) {
  return ENTRY_KINDS.filter((k) => counts[k] > 0)
    .map((k) => countLabel(k, counts[k]))
    .join(" y ");
}

export const displayTitle = (entry: { title: string | null }) =>
  entry.title?.trim() || "Sin título";

export function firstLine(body: string) {
  return (
    body
      .split("\n")
      .find((l) => l.trim())
      ?.trim() ?? ""
  );
}
