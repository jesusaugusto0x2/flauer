import type { Entry } from "@/db/schema";
import { DayEntriesNav, SideColumnHeader } from "./day-entries-nav";

/**
 * Desktop side column while writing: which day, and what's already in it. The
 * column is as tall as the window at most; a long list scrolls inside it.
 */
export function WriteAside({
  backHref,
  eyebrow,
  date,
  entries,
  currentId,
}: {
  backHref: string;
  eyebrow: string;
  date: string;
  entries: Pick<Entry, "id" | "kind" | "title">[];
  currentId?: string;
}) {
  return (
    <>
      <SideColumnHeader backHref={backHref} eyebrow={eyebrow} date={date} />
      {entries.length > 0 ? (
        <div className="flex min-h-0 flex-col">
          <p className="mb-1 shrink-0 text-[17px] text-secondary italic">
            Ya escribiste este día:
          </p>
          <DayEntriesNav
            entries={entries}
            currentId={currentId}
            label="Entradas de este día"
            dense
            className="min-h-0 scroll-area"
          />
        </div>
      ) : (
        <p className="text-[17px] text-secondary italic">Todavía no hay nada este día.</p>
      )}
    </>
  );
}
