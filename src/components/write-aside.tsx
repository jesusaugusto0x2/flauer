import type { Entry } from "@/db/schema";
import { DayEntriesNav, SideColumnHeader } from "./day-entries-nav";

/** Desktop side column while writing: which day, and what's already in it. */
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
        <div>
          <p className="mb-1 text-[17px] text-secondary italic">
            Ya escribiste este día:
          </p>
          <DayEntriesNav
            date={date}
            entries={entries}
            currentId={currentId}
            label="Entradas de este día"
            dense
          />
        </div>
      ) : (
        <p className="text-[17px] text-secondary italic">Todavía no hay nada este día.</p>
      )}
    </>
  );
}
