import Link from "next/link";
import type { Entry } from "@/db/schema";
import { shortDate } from "@/lib/dates";
import { displayTitle } from "@/lib/kinds";
import { Flower } from "./icons";

/**
 * Desktop side list of a day's entries. Poems open on their own page; notes are
 * read on their day, so they link there.
 */
export function DayEntriesNav({
  date,
  entries,
  currentId,
  label,
  dense = false,
}: {
  date: string;
  entries: Pick<Entry, "id" | "kind" | "title">[];
  currentId?: string;
  label: string;
  dense?: boolean;
}) {
  const row = `flex items-center gap-2.5 rounded-md px-3 ${
    dense ? "min-h-11 py-1.5 text-[18px]" : "min-h-12 py-2 text-[19px]"
  }`;

  return (
    <nav aria-label={label}>
      <ul className="flex flex-col gap-1">
        {entries.map((e) => {
          const content =
            e.kind === "poem" ? (
              <>
                <Flower kind="poem" size={14} />
                {displayTitle(e)}
              </>
            ) : (
              <>
                <Flower kind="note" size={14} />
                <span className="text-gold italic">{e.title?.trim() || "Nota"}</span>
              </>
            );
          return (
            <li key={e.id}>
              {e.id === currentId ? (
                <span aria-current="page" className={`${row} bg-pink/15 text-white`}>
                  {content}
                </span>
              ) : (
                <Link
                  href={e.kind === "poem" ? `/poem/${e.id}` : `/day/${date}`}
                  className={`${row} text-light hover:bg-light/7`}
                >
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Top of the desktop side column: back to the calendar, then which day this is. */
export function SideColumnHeader({
  backHref,
  eyebrow,
  date,
}: {
  backHref: string;
  eyebrow: string;
  date: string;
}) {
  return (
    <>
      <Link href={backHref} className="pill self-start px-4">
        <span aria-hidden="true">←</span> Calendario
      </Link>
      <div>
        <p className="text-[13px] tracking-[0.24em] text-secondary uppercase">
          {eyebrow}
        </p>
        <p className="mt-0.5 font-hand text-[38px] leading-[1.05] font-semibold">
          {shortDate(date)}
        </p>
      </div>
    </>
  );
}
